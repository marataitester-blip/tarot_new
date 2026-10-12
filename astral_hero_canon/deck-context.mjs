/**
 * Reference implementation for the author-approved canon v1.0.
 * All arguments must be resolved by the server; no client-supplied prompt fragments.
 * It does not call an LLM or modify the personality prompt.
 */
export function normalizeCardName(value) {
  if (typeof value !== 'string') throw new TypeError('Card ID/name must be a string');
  return value.normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё', 'е').trim().replace(/\s+/g, ' ');
}

export function buildAstralHeroContext({
  deckId,
  cards,
  registry,
  delta,
  deckContext,
  personalityPrompt,
  requireApproved = true,
}) {
  if (typeof personalityPrompt !== 'string') throw new TypeError('A personality prompt is required');
  if (deckId !== 'astral_hero') return { systemPrompt: personalityPrompt, cardIds: [], injectedCardIds: [], warnings: [] };
  if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards supplied');
  if (registry.deck_id !== deckId || delta.deck_id !== deckId) throw new Error('Deck metadata mismatch');
  if (typeof deckContext !== 'string' || !deckContext.trim()) throw new Error('Deck context is required');

  const lookup = new Map();
  const registryById = new Map();
  for (const card of registry.cards) {
    if (registryById.has(card.id)) throw new Error(`Duplicate registry ID: ${card.id}`);
    registryById.set(card.id, card);
    for (const alias of [card.id, card.name_ru, ...(card.aliases || [])]) {
      const key = normalizeCardName(alias);
      const old = lookup.get(key);
      if (old && old !== card.id) throw new Error(`Ambiguous alias: ${alias}`);
      lookup.set(key, card.id);
    }
  }

  const deltaById = new Map();
  for (const item of delta.cards) {
    if (deltaById.has(item.CARD)) throw new Error(`Duplicate delta ID: ${item.CARD}`);
    deltaById.set(item.CARD, item);
  }
  const cardIds = cards.map(card => {
    const value = typeof card === 'string' ? card : card?.id;
    const id = lookup.get(normalizeCardName(value));
    if (!id) throw new Error(`Unknown Astral Hero card: ${value}`);
    return id;
  });
  const blocks = [];
  const injectedCardIds = [];
  const warnings = [];
  for (const id of new Set(cardIds)) {
    const registryCard = registryById.get(id);
    const item = deltaById.get(id);
    if (registryCard.category === 'A') {
      if (item) throw new Error(`Category A unexpectedly has a delta: ${id}`);
      continue;
    }
    if (!item) throw new Error(`Missing required delta: ${id}`);
    if (requireApproved && item.AUTHOR_APPROVED !== true) throw new Error(`Canonical review required: ${id}`);
    if (item.AUTHOR_APPROVED !== true) warnings.push({ cardId: id, status: 'research_draft', pending: item.PENDING_DECISIONS || [] });
    if (item.CATEGORY === 'B') {
      blocks.push(`CARD: ${item.NAME_RU}\nASTRAL_HERO_DIFFERENCE: ${item.ASTRAL_HERO_DIFFERENCE}\nCORE_MEANING: ${item.CORE_MEANING}\nDO_NOT_DEFAULT_TO_WAITE: ${item.DO_NOT_DEFAULT_TO_WAITE}`);
    } else {
      blocks.push([
        `CARD: ${item.NAME_RU}`,
        `CLASSICAL CORRESPONDENCE: ${item.CLASSICAL_CORRESPONDENCE || 'нет'}`,
        `ASTRAL_HERO_DIFFERENCE: ${item.ASTRAL_HERO_DIFFERENCE}`,
        `CORE_MEANING: ${item.CORE_MEANING}`,
        `KEEP_FROM_WAITE: ${item.KEEP_FROM_WAITE}`,
        `DO_NOT_DEFAULT_TO_WAITE: ${item.DO_NOT_DEFAULT_TO_WAITE}`,
        `VISUAL_CUE: ${item.VISUAL_CUE}`,
      ].join('\n'));
    }
    injectedCardIds.push(id);
  }
  const sharedBlocks = [];
  const injectedSharedLayerIds = [];
  for (const layer of delta.shared_layers || []) {
    if (!layer.activate_for_any_card_ids.some(id => cardIds.includes(id))) continue;
    if (requireApproved && layer.author_approved !== true) throw new Error(`Canonical review required: ${layer.id}`);
    sharedBlocks.push(layer.runtime_context);
    injectedSharedLayerIds.push(layer.id);
  }
  const context = [deckContext.trim(), ...sharedBlocks, ...blocks].join('\n\n');
  return { systemPrompt: personalityPrompt + '\n\n' + context, cardIds, injectedCardIds, injectedSharedLayerIds, warnings, deckVersion: delta.version };
}

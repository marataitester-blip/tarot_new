# Астральный Герой — согласованный комплект v1.0

Версия 1.0.0. Марат утвердил смысловой слой 12 октября 2026: авторские поправки включены, остальные исследовательские трактовки приняты.

- ASTRAL_HERO_RESEARCH.md — тот же отчёт для копирования.
- AUTHOR_CANON.md — краткая фиксация авторской философии и уточнений.
- ASTRAL_HERO_DELTA.json — 20 карточных блоков и shared_layers/love_axis.
- ASTRAL_HERO_REGISTRY.json — полный состав 80 карт и алиасы.
- ASTRAL_HERO_DECK_CONTEXT.txt — общий системный контекст.
- EXAMPLE_PROMPT.txt — две карты A и авторская Восьмёрка Жезлов.
- deck-context.mjs — готовая функция серверного отбора контекста.
- SOURCE_MANIFEST.json — источники исследования и прямое авторское согласование.

## Подключение

```js
import { readFileSync } from 'node:fs';
import { buildAstralHeroContext } from './deck-context.mjs';
const registry = JSON.parse(readFileSync('./ASTRAL_HERO_REGISTRY.json', 'utf8'));
const delta = JSON.parse(readFileSync('./ASTRAL_HERO_DELTA.json', 'utf8'));
const deckContext = readFileSync('./ASTRAL_HERO_DECK_CONTEXT.txt', 'utf8');
const result = buildAstralHeroContext({
  deckId: 'astral_hero',
  cards: ['magician', 'two_of_pentacles', 'eight_of_wands'],
  registry, delta, deckContext,
  personalityPrompt: existingPilotOrMargotPrompt,
});
// result.systemPrompt — неизменённая личность + выбранный контекст колоды.
// result.injectedCardIds — ['eight_of_wands'].
// result.injectedSharedLayerIds — [] для этого примера.
```

Сервер подбирает данные сам; клиент не присылает произвольный system prompt. requireApproved по умолчанию true. Для трёх карт оси любви общий блок добавляется только один раз. Неизвестное имя отклоняется, другая колода не получает дельту, повторные IDs не дублируют блоки. Имена карточных позиций и вопрос передаются отдельно. Данные колоды не изменяют личность спикера.

Сохранение справочника не означает, что он уже установлен в действующее приложение. Интеграция, публикация и платные LLM-прогоны не выполнялись. Физическая и анимированная Белая карта описаны автором отдельно от цифрового WebP.

## Размещение в tarot_new

Эта папка — единый авторский смысловой слой для Pilot/Margot. Изображения и видео находятся в основном репозитории; младшие анимации — в ../minor_arcana/. Исторический final_deck.json сохранён; для новых AI-чтений авторским источником служит ASTRAL_HERO_DELTA.json вместе с общим контекстом.

Правки смыслового слоя не подключены автоматически к действующему приложению. При чтении фиксируйте deckVersion=1.0.0.

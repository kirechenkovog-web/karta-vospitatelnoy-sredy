import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getAspect } from "@/data/aspects";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Ты — проактивный наставник советника директора по воспитанию, который сопровождает работу с цифровым инструментом «Карта воспитательной среды».

ВАЖНО О ЗАМЕТКАХ:
Когда ты добавляешь команды [NOTE:...] в сообщение — они НЕВИДИМЫ пользователю в чате. Они автоматически появляются как структурированные заметки в карточке аспекта. Не говори пользователю «я зафиксировал» или «я добавил в заметки» — просто добавляй команды тихо, продолжая разговор.

КТО ТАКОЙ ПОЛЬЗОВАТЕЛЬ:
Советник директора по воспитанию — педагог в образовательной организации (школа, техникум, колледж и др.), отвечающий за воспитательную работу. Не говори «в вашей школе» — говори «в вашей организации» или «в вашем учреждении». Он может быть незнаком с форматом самодиагностики и инструментом. Твоя задача — объяснять просто и по-человечески, создавать ощущение поддержки, а не экзамена.

ТВОЯ РОЛЬ — ВЕСТИ ПО СТРУКТУРЕ:
Ты проводник. На каждой странице есть структура действий — проводи через неё шаг за шагом.
- Начинаешь с нужного шага текущей страницы
- Задай 1–2 уточняющих вопроса на каждом шаге, если ответ поверхностный
- Никогда не застревай на одном шаге дольше 3–4 обменов

СТРУКТУРА ЭТАПА 1 (оценка аспекта) — ТРИ ФАЗЫ:

Фаза 1 — Введение и стартовый вопрос:
  • Одним абзацем объясни, ЧТО МЫ ИМЕЕМ В ВИДУ под этим аспектом — опирайся на его описание и суть. НЕ говори «это важно потому что» — просто введи понятие.
  • Задай ОДИН конкретный вопрос, на который легко ответить: про цифры, людей, конкретные активности.

Фаза 2 — Уточняющие вопросы:
  • Задай 1–2 вопроса о текущем состоянии — конкретных и практических
  • Фиксируй факты в [NOTE:bullet:...]
  • Когда получил достаточно информации — задай вопрос об УДОВЛЕТВОРЁННОСТИ: «А если в целом — насколько вы довольны тем, как у вас [ключевые 3–5 слов из сути аспекта]?» Например: «...как у вас выстроена работа с партнёрами?», «...вовлечены педагоги в воспитательную работу?», «...организована работа актива?». Акцент — на личной удовлетворённости советника, а не просто на фактах из разговора. НЕ предлагай цифру сам. Добавь в конец ответа [SCORE_REQUEST] — пользователю покажутся кнопки с оценками от 1 до 10.

Фаза 3 — Идеальное состояние:
  • После оценки: «А как выглядело бы идеальное состояние этого аспекта для вас?»
  • Помоги сформулировать конкретно, добавляй [NOTE:heading:Идеальное состояние] и [NOTE:bullet:...]
  • Когда всё обсудили — добавь кнопку завершения (см. ниже)

ВАЖНО — ШКАЛА: Оценка строго от 1 до 10. НЕ предлагай цифру сам — спрашивай мнение пользователя.
НЕ ОБСУЖДАЙ на этапе 1: результаты, ресурсы, вызовы, индикаторы — это для этапа 2.

КНОПКА ЗАВЕРШЕНИЯ АСПЕКТА:
Когда завершены все три фазы (введение → вопросы → оценка → идеал), добавь в конец ответа команду:
[BUTTON:Сохранить и перейти к следующему аспекту]
Пользователь нажмёт её прямо в чате. Добавляй команду ОДИН раз, когда считаешь аспект завершённым. Не повторяй в следующих сообщениях.

Правила для заметок:
- Добавляй [NOTE:...] когда пользователь поделился конкретными фактами
- [NOTE:heading:Текст] — заголовок раздела (редко)
- [NOTE:bullet:Текст] — ключевые мысли и факты (основной формат)
- [NOTE:quote:Текст] — дословная важная цитата (коротко)
- Заметки невидимы в чате, появляются в карточке аспекта

СТРУКТУРА ЭТАПА 2 (углублённый анализ):
Пользователь САМИ заполняет карточки аспектов в правой части экрана — кликает на аспект и вводит текст в поля. Твоя роль — объяснить что куда писать и поддерживать в процессе.

Что означают поля:
• Результаты — что уже достигнуто: конкретные мероприятия, инициативы, изменения
• Ресурсы — что есть в наличии: люди, связи, время, пространства
• Вызовы — что создаёт трудности, что мешает
• Индикаторы достижения цели — как конкретно поймёте, что стало лучше? Что изменится в поведении, числах, процессах?

Пример (аспект «Организация работы школьного актива»):
Результаты: 4 крупных мероприятия в год, которые проводят сами активисты
Ресурсы: сплочённая команда из 12 активистов, 15–20 человек которых иногда можно привлечь, совет старост классов
Вызовы: большинство активистов выпускаются через год
Индикаторы достижения цели: привлечь в актив 7–8 классников, регулярные встречи каждую неделю без моего участия в подготовке

Когда пользователь заполнил поле — кратко отреагируй (1–2 предложения), при необходимости уточни.

СТРУКТУРА ЭТАПА 3 (фокус и стратегия):
Шаг 1 — Выбор фокуса: помоги выбрать 1–2 аспекта, объясни логику.
Шаг 2 — Желаемый результат: конкретный и измеримый за 2 месяца.
Шаг 3 — Первые шаги: что можно сделать прямо на этой неделе?
Шаг 4 — Завершение.

ПАМЯТЬ СЕССИИ:
Используй сводку сессии — что пользователь оценил, какие баллы. Делай ссылки на предыдущие ответы.

КАК РАБОТАЮТ СОБЫТИЯ:
[СОБЫТИЕ: описание] — действие пользователя в интерфейсе. Реагируй кратко, не более 1 вопроса. Если пользователь заполнил поле в правой части — отреагируй и предложи следующий шаг.

Стиль: уважительный, живой, поддерживающий, краткий, конкретный. Обращайся на «вы». Используй эмодзи умеренно — не в каждом предложении. **Ключевые понятия выделяй жирным.**
Длина: не более 3–4 предложений или 3–4 пунктов. Один вопрос за раз.

УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ:
В самом конце ответа (отдельной строкой) можно добавить ОДНУ команду:
[ACTION:highlight:score-selector] — подсветить выбор оценки
[ACTION:highlight:save-button] — подсветить кнопку сохранения
[ACTION:highlight:next-stage-button] — подсветить переход к следующему этапу
[ACTION:highlight:results-field] — подсветить поле результатов
[ACTION:highlight:resources-field] — подсветить поле ресурсов
[ACTION:highlight:challenges-field] — подсветить поле вызовов
[ACTION:highlight:indicators-field] — подсветить поле индикаторов
[ACTION:highlight:focus-selector] — подсветить выбор фокусных аспектов
[ACTION:highlight:target-result-field] — подсветить поле результата (этап 3)
[ACTION:highlight:first-steps-field] — подсветить поле первых шагов (этап 3)
[BUTTON:текст] — добавить кнопку в чат (только для завершения аспекта на этапе 1)
[NOTE:heading:Текст] / [NOTE:bullet:Текст] / [NOTE:quote:Текст] — заметки (невидимы)`;

function getStagePrompt(stage: number, aspectTitle?: string, aspectDescription?: string, isAuto?: boolean, hints?: string[]): string {
  if (stage === 1 && aspectTitle) {
    const hintsBlock = hints && hints.length > 0
      ? `\n\nПримеры наводящих вопросов (используй 1–2 в фазе 2):\n${hints.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
      : "";
    const descBlock = aspectDescription ? `\nОпределение аспекта: ${aspectDescription}` : "";
    if (isAuto) {
      return `Пользователь открыл аспект «${aspectTitle}».${descBlock}\nНачни фазу 1: объясни одним абзацем что мы имеем в виду под этим аспектом (без «это важно потому что»). Затем задай ОДИН конкретный простой вопрос про числа, людей или конкретные активности.${hintsBlock}`;
    }
    return `Пользователь оценивает аспект «${aspectTitle}».${descBlock}\nВеди через фазы: введение понятия → уточняющие вопросы → спроси оценку у пользователя → идеальное состояние.${hintsBlock}`;
  }
  if (stage === 1 && !aspectTitle) {
    if (isAuto) return `Пользователь открыл главную карту с 12 аспектами (этап 1). Скажи одной-двумя фразами: 1) что нужно кликнуть на любой аспект чтобы начать, 2) что ты будешь вести беседу и задавать вопросы — но в любой момент советник может сам выставить оценку в правой части экрана и перейти к следующему аспекту без разговора. НЕ приветствуй. Подсвети одну карточку: [ACTION:highlight:aspect-card-social_partners]`;
    return "Пользователь на главной карте. Предложи кликнуть на любой аспект чтобы начать.";
  }
  if (stage === 2) {
    if (isAuto) return `Пользователь перешёл к этапу 2 — углублённый анализ. Поздравь с завершением оценки всех аспектов (кратко, 1 фраза). Объясни: на этом этапе можно заполнить карточки по ВСЕМ аспектам — или ТОЛЬКО по самым важным (например, тем, где низкие оценки или где хочется сосредоточиться). Скажи что нужно кликнуть на любой аспект справа чтобы начать. Объясни кратко что означают 4 поля — с примерами на основе аспекта «Школьный актив»: Результаты — что уже достигнуто (например: «4 крупных мероприятия в год, которые проводят сами активисты»); Ресурсы — что есть в наличии (например: «сплочённая команда из 12 активистов, совет старост»); Вызовы — что мешает (например: «большинство активистов выпускаются через год»); Индикаторы — как поймёте что стало лучше (например: «привлечь в актив 7–8 классников, еженедельные встречи без моего участия»).`;
    return `Помоги пользователю углубить анализ. ${aspectTitle ? `Аспект: «${aspectTitle}». Пользователь заполняет поля сам в правой части — реагируй на то что он написал.` : "Жди пока пользователь выберет аспект."}`;
  }
  if (stage === 3) {
    if (isAuto) return `Пользователь перешёл к этапу 3 — выбор фокуса. Поздравь кратко. Объясни: нужно выбрать 1–2 аспекта на 2 месяца, сформулировать конкретный результат и первые шаги. Подсвети выбор фокусных аспектов. [ACTION:highlight:focus-selector]`;
    return "Помоги выбрать фокус развития и сформулировать конкретные шаги.";
  }
  return "Помоги пользователю пройти карту воспитательной среды.";
}

// Parse [ACTION:highlight:element-id]
function parseAction(reply: string): { text: string; highlightId: string | null } {
  const actionRegex = /\[ACTION:highlight:([\w-]+)\]\s*$/;
  const match = reply.match(actionRegex);
  if (match) {
    return { text: reply.replace(actionRegex, "").trim(), highlightId: match[1] };
  }
  return { text: reply, highlightId: null };
}

// Parse [BUTTON:text] — adds a clickable button in the chat
function parseButton(text: string): { text: string; buttonLabel: string | null } {
  const match = text.match(/\[BUTTON:([^\]]+)\]\s*$/);
  if (match) {
    return { text: text.replace(/\[BUTTON:[^\]]+\]\s*$/, "").trim(), buttonLabel: match[1].trim() };
  }
  return { text, buttonLabel: null };
}

// Parse [SCORE:N]
function parseSuggestedScore(text: string): { text: string; suggestedScore: number | null } {
  const match = text.match(/\[SCORE:(\d+)\]/);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 1 && score <= 10) {
      return { text: text.replace(/\[SCORE:\d+\]/, "").trim(), suggestedScore: score };
    }
  }
  return { text, suggestedScore: null };
}

// Parse [SCORE_REQUEST]
function parseScoreRequest(text: string): { text: string; scoreRequest: boolean } {
  if (text.includes("[SCORE_REQUEST]")) {
    return { text: text.replace(/\[SCORE_REQUEST\]/g, "").trim(), scoreRequest: true };
  }
  return { text, scoreRequest: false };
}

// Parse [NOTE:type:content]
interface NoteItem { type: "heading" | "bullet" | "quote"; text: string; }

function parseNoteItems(text: string): { text: string; noteItems: NoteItem[] } {
  const noteItems: NoteItem[] = [];
  const cleaned = text.replace(/\[NOTE:(heading|bullet|quote):([^\]]+)\]/g, (_, type, content) => {
    noteItems.push({ type: type as NoteItem["type"], text: content.trim() });
    return "";
  }).replace(/\n{3,}/g, "\n\n").trim();
  return { text: cleaned, noteItems };
}

export async function POST(req: NextRequest) {
  const { sessionId, stage, aspectCode, message, history, isAuto, sessionContext } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Сообщение обязательно" }, { status: 400 });
  }

  const aspect = aspectCode ? getAspect(aspectCode) : undefined;
  const stageContext = getStagePrompt(stage, aspect?.title, aspect?.description, isAuto, aspect?.hints);

  const sessionSummary = sessionContext
    ? `\n\nСВОДКА СЕССИИ:\n${sessionContext}`
    : "";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nКонтекст текущего момента: ${stageContext}${sessionSummary}` },
    ...(history || []).slice(-10).map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    ),
    { role: "user", content: message },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const rawReply = completion.choices[0].message.content ?? "";
    const { text: afterAction, highlightId } = parseAction(rawReply);
    const { text: afterButton, buttonLabel } = parseButton(afterAction);
    const { text: afterScore, suggestedScore } = parseSuggestedScore(afterButton);
    const { text: afterScoreReq, scoreRequest } = parseScoreRequest(afterScore);
    const { text: reply, noteItems } = parseNoteItems(afterScoreReq);

    if (sessionId) {
      await prisma.aIMessage.createMany({
        data: [
          { sessionId, stage, aspectCode, role: "user", messageText: message },
          { sessionId, stage, aspectCode, role: "assistant", messageText: reply },
        ],
      });
    }

    return NextResponse.json({ reply, highlightId, buttonLabel, suggestedScore, scoreRequest, noteItems });
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json(
      { error: "Ошибка AI-ассистента. Проверьте API ключ." },
      { status: 500 }
    );
  }
}

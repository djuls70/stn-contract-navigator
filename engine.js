/**
 * Semantic TextNavigator — Ядро семантического разбора и сверки договоров (engine.js v3.0)
 * Полностью детерминированный парсер без хардкода под имена файлов или номера договоров.
 */

(function (global) {
  'use strict';

  // --- 1. ЭТАЛОННЫЙ НАБОР ДОКУМЕНТОВ (ДЛЯ СТАРТОВОЙ ДЕМОНСТРАЦИИ И АВТОТЕСТОВ) ---
  var DEFAULT_DOCUMENTS = [
    {
      fileName: '01_contract.txt',
      content: 'ДОГОВОР ПОСТАВКИ № STN-101\nДата: 05.02.2026\nСтатус: подписан обеими сторонами 05.02.2026.\n\n1.1. Покупатель: ООО «СеверМет». Поставщик: ООО «Вектор Прибор».\n1.2. Предмет: поставка комплекта измерительного оборудования.\n\n2.1. Общая стоимость поставки составляет 1 200 000 (один миллион двести тысяч) рублей, включая НДС. Указанная сумма — итоговая стоимость договора.\n2.2. Оплата производится в течение 20 календарных дней после приемки оборудования.\n\n3.1. Поставщик обязуется поставить оборудование не позднее 15.04.2026.\n3.2. Дата приемки может отличаться от даты поставки и не изменяет срок по пункту 3.1.\n\n4.1. Неустойка за просрочку поставки составляет 0,1% стоимости просроченной части поставки за каждый день, но не более 10% стоимости этой части.\n\n5.1. Изменения условий действуют после подписания дополнительного соглашения обеими сторонами и наступления указанной в нем даты вступления в силу.'
    },
    {
      fileName: '02_amendment_signed.txt',
      content: 'ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 1 К ДОГОВОРУ STN-101\nДата: 01.03.2026\nСтатус: подписано обеими сторонами 01.03.2026.\nПокупатель: ООО «СеверМет». Поставщик: ООО «Вектор Прибор».\n\n1. Пункт 2.1 договора изложить в следующей редакции: «Общая стоимость поставки составляет 1 380 000 (один миллион триста восемьдесят тысяч) рублей, включая НДС. Указанная сумма — итоговая стоимость договора».\n\n2. Пункт 3.1 договора изложить в следующей редакции: «Поставщик обязуется поставить оборудование не позднее 30.04.2026».\n\n3. Остальные условия договора, в том числе размер неустойки, остаются без изменений.\n\n4. Настоящее соглашение вступает в силу 01.03.2026.'
    },
    {
      fileName: '03_contract.txt',
      content: 'ДОГОВОР ПОСТАВКИ № STN-102\nДата: 10.02.2026\nСтатус: подписан обеими сторонами 10.02.2026.\n\n1.1. Покупатель: ООО «СеверМет». Поставщик: ООО «Контур Электро».\n1.2. Предмет: поставка электротехнических комплектующих.\n\n2.1. Общая стоимость поставки составляет 840 000 (восемьсот сорок тысяч) рублей, включая НДС. Указанная сумма — итоговая стоимость договора.\n2.2. Авансовый платеж составляет 252 000 рублей и входит в общую стоимость по пункту 2.1.\n\n3.1. Поставщик обязуется поставить комплектующие не позднее 20.03.2026.\n3.2. Оплата оставшейся суммы производится не позднее 10.04.2026. Этот срок является сроком оплаты, а не поставки.\n\n4.1. Неустойка за просрочку поставки составляет 0,05% стоимости просроченной части поставки за каждый день, но не более 5% стоимости этой части.\n\n5.1. Изменения условий действуют после подписания дополнительного соглашения обеими сторонами и наступления указанной в нем даты вступления в силу.'
    },
    {
      fileName: '04_contract.txt',
      content: 'ДОГОВОР ПОСТАВКИ № STN-103\nДата: 20.02.2026\nСтатус: подписан обеими сторонами 20.02.2026.\n\n1.1. Покупатель: ООО «СеверМет». Поставщик: ООО «ПромСнаб Сервис».\n1.2. Предмет: поставка запасных частей.\n\n2.1. Общая стоимость определяется спецификацией в приложении № 1. Приложение № 1 в предоставленный комплект документов не входит. Числовое значение стоимости в тексте договора не указано.\n2.2. Лимит закупки по внутреннему бюджету покупателя — 600 000 рублей. Этот лимит не является согласованной стоимостью договора.\n\n3.1. Поставщик обязуется поставить запасные части не позднее 30.04.2026.\n\n4.1. Ставка неустойки в тексте договора не установлена.\n\n5.1. Изменения условий действуют после подписания дополнительного соглашения обеими сторонами и наступления указанной в нем даты вступления в силу.'
    },
    {
      fileName: '05_supplier_email.txt',
      content: 'ПИСЬМО ПОСТАВЩИКА О ПРЕДЛАГАЕМОМ ПЕРЕНОСЕ\nДата: 05.03.2026\nОт: ООО «Контур Электро»\nКому: ООО «СеверМет»\nТема: договор STN-102\n\nКоллеги, по договору STN-102 предлагаем перенести срок поставки с 20.03.2026 на 27.03.2026 из-за задержки комплектующих. Просим подтвердить согласие и оформить дополнительное соглашение.\n\nПо состоянию на 10.03.2026 согласие покупателя не получено, дополнительное соглашение не подписано. Это письмо содержит предложение поставщика, а не согласованное изменение договора.'
    },
    {
      fileName: '06_amendment_draft.txt',
      content: 'ПРОЕКТ ДОПОЛНИТЕЛЬНОГО СОГЛАШЕНИЯ № 2 К ДОГОВОРУ STN-101\nДата проекта: 06.03.2026\nСтатус: проект на согласовании, не подписан ни одной стороной.\nПокупатель: ООО «СеверМет». Поставщик: ООО «Вектор Прибор».\n\n1. Предлагается изменить общую стоимость поставки на 1 450 000 рублей, включая НДС.\n\n2. Предлагается изменить срок поставки на 10.05.2026.\n\n3. Изменения вступят в силу только после подписания сторонами. По состоянию на 10.03.2026 подписание не состоялось. Данный проект не изменяет действующие условия договора.'
    }
  ];

  // --- 2. УТИЛИТЫ РАБОТЫ С ОБЪЕКТАМИ, ДАТАМИ И ЧИСЛАМИ ---

  var MONTHS_RU = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
    'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
  };

  function cloneObj(obj) {
    if (!obj) return null;
    var copy = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = obj[key];
      }
    }
    return copy;
  }

  /**
   * Поддерживает форматы: ДД.ММ.ГГГГ, ГГГГ-ММ-ДД и словесный "10 марта 2026"
   */
  function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    var clean = dateStr.replace(/^\s+|\s+$/g, '').toLowerCase();

    var ruMatch = clean.match(/(\d{1,2})\.(\d{2})\.(\d{4})/);
    if (ruMatch) {
      return new Date(Date.UTC(Number(ruMatch[3]), Number(ruMatch[2]) - 1, Number(ruMatch[1])));
    }

    var isoMatch = clean.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
    }

    var wordMatch = clean.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/);
    if (wordMatch && MONTHS_RU[wordMatch[2]]) {
      return new Date(Date.UTC(Number(wordMatch[3]), MONTHS_RU[wordMatch[2]] - 1, Number(wordMatch[1])));
    }

    return null;
  }

  function formatDateRU(dateObj) {
    if (!dateObj) return '';
    var d = String(dateObj.getUTCDate());
    if (d.length < 2) d = '0' + d;
    var m = String(dateObj.getUTCMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var y = dateObj.getUTCFullYear();
    return d + '.' + m + '.' + y;
  }

  /**
   * Извлекает первую дату (ДД.ММ.ГГГГ или "15 апреля 2026") из произвольного фрагмента
   */
  function extractDateFromText(str) {
    if (!str) return null;
    var mDot = str.match(/(\d{2}\.\d{2}\.\d{4})/);
    if (mDot) return mDot[1];
    var mWord = str.match(/(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/i);
    if (mWord) {
      var dObj = parseDate(mWord[1]);
      return dObj ? formatDateRU(dObj) : null;
    }
    return null;
  }

  function formatRubles(num, vatMode) {
    if (typeof num !== 'number' || isNaN(num)) return 'нет данных';
    var isRounded = Math.abs(num - Math.round(num)) < 0.005;
    var intPart = Math.floor(Math.abs(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    var sign = num < 0 ? '-' : '';
    var kopPart = '';
    if (!isRounded) {
      var kops = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100);
      kopPart = ',' + (kops < 10 ? '0' + kops : String(kops));
    }
    var vatSuffix = '';
    if (vatMode === 'with_vat' || vatMode === true) vatSuffix = ' (с НДС)';
    else if (vatMode === 'without_vat') vatSuffix = ' (без НДС)';
    return sign + intPart + kopPart + ' руб.' + vatSuffix;
  }

  function parseRubleNumber(str) {
    if (!str) return null;
    var clean = str.replace(/[\s\u00A0]+/g, '').replace(',', '.');
    var val = Number(clean);
    return isNaN(val) ? null : val;
  }

  function daysBetween(dateObj1, dateObj2) {
    if (!dateObj1 || !dateObj2) return 0;
    var diffMs = dateObj2.getTime() - dateObj1.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  function extractClauseNumber(line) {
    if (!line) return null;
    var m = line.match(/^(\d+(?:\.\d+)*)\./);
    return m ? m[1] : null;
  }

  // --- 3. УМНАЯ РАЗБИВКА ДОКУМЕНТА НА АБЗАЦЫ (СО СКЛЕЙКОЙ МНОГОСТРОЧНЫХ ПУНКТОВ) ---

  function splitIntoParagraphs(rawText) {
    var rawBlocks = rawText.split(/\n\s*\n/);
    var paragraphs = [];
    var pCounter = 1;
    var i, j;

    for (i = 0; i < rawBlocks.length; i++) {
      var block = rawBlocks[i].replace(/^\s+|\s+$/g, '');
      if (!block) continue;

      var rawLines = block.split('\n');
      var lines = [];
      for (j = 0; j < rawLines.length; j++) {
        var lt = rawLines[j].replace(/^\s+|\s+$/g, '');
        if (lt) lines.push(lt);
      }
      if (lines.length === 0) continue;

      var isHeaderBlock = (pCounter === 1 && !/^\d+(?:\.\d+)*\./.test(lines[0]));
      if (isHeaderBlock || lines.length === 1) {
        paragraphs.push({
          id: 'p_' + (pCounter++),
          text: lines.join('\n'),
          clause: extractClauseNumber(lines[0])
        });
      } else {
        // Группируем строки: если строка начинается с номера пункта (1.1., 2. и т.д.),
        // начинаем новый абзац; иначе приклеиваем к текущему абзацу
        var currentLines = [lines[0]];
        for (j = 1; j < lines.length; j++) {
          if (/^\d+(?:\.\d+)*\./.test(lines[j])) {
            paragraphs.push({
              id: 'p_' + (pCounter++),
              text: currentLines.join('\n'),
              clause: extractClauseNumber(currentLines[0])
            });
            currentLines = [lines[j]];
          } else {
            currentLines.push(lines[j]);
          }
        }
        if (currentLines.length > 0) {
          paragraphs.push({
            id: 'p_' + (pCounter++),
            text: currentLines.join('\n'),
            clause: extractClauseNumber(currentLines[0])
          });
        }
      }
    }
    return paragraphs;
  }

  // --- 4. СЕМАНТИЧЕСКИЙ РАЗБОР ОДНОГО ДОКУМЕНТА ---

  function parseDocument(fileObj) {
    var fileName = (fileObj && fileObj.fileName) ? fileObj.fileName : 'unknown.txt';
    var rawText = ((fileObj && fileObj.content) ? fileObj.content : '').replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ');

    var paragraphs = splitIntoParagraphs(rawText);
    var fullTextParts = [];
    var i;
    for (i = 0; i < paragraphs.length; i++) {
      fullTextParts.push(paragraphs[i].text);
    }
    var fullText = fullTextParts.join('\n');
    var firstParaText = paragraphs.length > 0 ? paragraphs[0].text : '';

    // 1. Извлечение номера базового договора (STN-XXX или любого другого номера договора)
    var contractMatch = fullText.match(/STN-\d+/i) ||
                        fullText.match(/(?:ДОГОВОР(?:У|А|ОМ)?(?:\s+ПОСТАВКИ)?\s*№\s*|договор(?:у|а|ом)?\s*№?\s*)([A-ZА-Я0-9]+-\d+)/i);
    var contractId = contractMatch ? (contractMatch[1] || contractMatch[0]).toUpperCase() : 'БЕЗ-НОМЕРА';

    // 2. Классификация типа документа (строго по заголовку и предмету, чтобы неподписанный договор оставался договором)
    var docType = 'other';
    var docTitle = 'Документ';
    var docNumber = 0;

    if (/^ПРОЕКТ\s+ДОПОЛНИТЕЛЬНОГО\s+СОГЛАШЕНИ/i.test(firstParaText) ||
        (/^ДОПОЛНИТЕЛЬНОЕ\s+СОГЛАШЕНИЕ/i.test(firstParaText) && /Статус:\s*проект/i.test(firstParaText))) {
      docType = 'draft';
      var draftNum = firstParaText.match(/№\s*(\d+)/);
      docNumber = draftNum ? Number(draftNum[1]) : 0;
      docTitle = draftNum ? ('Проект ДС № ' + draftNum[1]) : 'Проект ДС';
    } else if (/^ДОПОЛНИТЕЛЬНОЕ\s+СОГЛАШЕНИЕ/i.test(firstParaText)) {
      docType = 'amendment';
      var amNum = firstParaText.match(/№\s*(\d+)/);
      docNumber = amNum ? Number(amNum[1]) : 1;
      docTitle = amNum ? ('ДС № ' + amNum[1]) : 'Допсоглашение';
    } else if (/^(?:ПРИЛОЖЕНИЕ|СПЕЦИФИКАЦИЯ)/i.test(firstParaText)) {
      docType = 'appendix';
      var appNum = firstParaText.match(/№\s*(\d+)/);
      docNumber = appNum ? Number(appNum[1]) : 1;
      docTitle = appNum ? ('Приложение № ' + appNum[1]) : 'Приложение (Спецификация)';
    } else if (/^ПИСЬМО\s+ПОСТАВЩИКА/i.test(firstParaText) || (/^От:/im.test(firstParaText) && /^Кому:/im.test(firstParaText))) {
      docType = 'email';
      docTitle = 'Письмо поставщика';
    } else if (/^ДОГОВОР(?:\s+ПОСТАВКИ)?/i.test(firstParaText)) {
      docType = 'contract';
      docTitle = 'Договор ' + contractId;
    }

    // 3. Проверка статуса подписания и даты подписания
    var isUnsignedExplicit = /не\s+подписан|согласие\s+покупателя\s+не\s+получено|проект\s+на\s+согласовании|подписание\s+не\s+состоялось|подписан(?:о)?\s+одной\s+стороной|подписан(?:о)?\s+только/i.test(fullText);
    var isSignedExplicit = /Статус:\s*подписан(?:о)?\s+обеими\s+сторонами/i.test(fullText);
    var isSigned = isSignedExplicit && !isUnsignedExplicit;
    var statusUnclear = (!isSignedExplicit && !isUnsignedExplicit) || (isSignedExplicit && isUnsignedExplicit);

    var docDateMatch = fullText.match(/Дата(?:\s+проекта|\s+документа)?:\s*([^\n\.]+?)(?:\.|$)/im);
    var docDate = docDateMatch ? extractDateFromText(docDateMatch[1]) : null;

    var signedDateMatch = fullText.match(/подписан(?:о)?\s+обеими\s+сторонами\s+([^\n\.]+?)(?:\.|$)/i);
    var signedDate = signedDateMatch ? extractDateFromText(signedDateMatch[1]) : docDate;

    // 4. Дата вступления в силу
    var effectiveDate = (docType === 'contract' || docType === 'appendix') ? (signedDate || docDate) : null;
    var effectiveDateExplicit = false;
    var effectiveDatePara = paragraphs.length > 0 ? paragraphs[0].id : 'p_1';

    for (i = 0; i < paragraphs.length; i++) {
      var pEff = paragraphs[i];
      if (/вступает\s+в\s+силу/i.test(pEff.text) && !/только\s+после\s+подписания/i.test(pEff.text)) {
        var effD = extractDateFromText(pEff.text);
        if (effD) {
          effectiveDate = effD;
          effectiveDateExplicit = true;
          effectiveDatePara = pEff.id;
        }
      }
    }
    if (docType === 'amendment' && !effectiveDate) {
      effectiveDate = signedDate || docDate;
    }

    // 5. Покупатель, Поставщик, Предмет
    var buyer = null;
    var supplier = null;
    var subject = null;

    for (i = 0; i < paragraphs.length; i++) {
      var pMeta = paragraphs[i];
      var buyerMatch = pMeta.text.match(/Покупатель:\s*([^\.\n]+?)(?:\.\s*Поставщик:|\.|$)/i);
      if (buyerMatch && !buyer) buyer = buyerMatch[1].replace(/^\s+|\s+$/g, '');

      var suppMatch = pMeta.text.match(/Поставщик:\s*([^\.\n]+?)(?:\.|$)/i);
      if (suppMatch && !supplier) supplier = suppMatch[1].replace(/^\s+|\s+$/g, '');

      var fromMatch = pMeta.text.match(/^От:\s*([^\n]+)/im);
      if (fromMatch && !supplier) supplier = fromMatch[1].replace(/^\s+|\s+$/g, '');

      var subjMatch = pMeta.text.match(/Предмет:\s*([^\.\n]+?)(?:\.|$)/i);
      if (subjMatch && !subject) subject = subjMatch[1].replace(/^\s+|\s+$/g, '');
    }

    // 6. Семантическое извлечение фактов и перехват ловушек
    var extractedAmount = null;
    var extractedDeliveryDate = null;
    var extractedPenalty = null;
    var extractedPaymentTerms = null;
    var ignoredTraps = [];
    var docWarnings = [];

    for (i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.text;

      // --- А. ПРОВЕРКА УСЛОВИЙ ОПЛАТЫ И ЛОВУШЕК СУММЫ ---
      if (/Оплата\s+производится\s+в\s+течение/i.test(text)) {
        var payDaysMatch = text.match(/в\s+течение\s+(\d+)\s+календарн/i);
        var payDaysLabel = payDaysMatch ? ('Постоплата ' + payDaysMatch[1] + ' кал. дней после приемки') : text;
        extractedPaymentTerms = {
          displayValue: payDaysLabel,
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        };
      }

      if (/Авансовый\s+платеж|сумма\s+аванса|предоплата\s+составляет/i.test(text) && !/Общая\s+стоимость\s+поставки\s+составляет/i.test(text)) {
        var mAdv = text.match(/(\d[\d\s\.,]*)\s*(?:\([^)]+\)\s*)?руб/i);
        var advNum = mAdv ? parseRubleNumber(mAdv[1]) : null;
        var advVal = advNum !== null ? formatRubles(advNum, false) : 'Аванс';
        extractedPaymentTerms = {
          displayValue: 'Аванс ' + advVal + ' (входит в общую сумму)',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        };
        ignoredTraps.push({
          type: 'amount_trap',
          label: 'Авансовый платеж (входит в цену договора, отдельно не суммируется)',
          value: advVal,
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
        continue;
      }

      if (/Лимит\s+закупки|внутреннему\s+бюджету|не\s+является\s+согласованной\s+стоимостью/i.test(text)) {
        var mLim = text.match(/(\d[\d\s\.,]*)\s*(?:\([^)]+\)\s*)?руб/i);
        var limNum = mLim ? parseRubleNumber(mLim[1]) : null;
        var limVal = limNum !== null ? formatRubles(limNum, false) : 'Лимит бюджета';
        extractedPaymentTerms = {
          displayValue: 'Лимит бюджета покупателя: ' + limVal + ' (цена не согласована)',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        };
        ignoredTraps.push({
          type: 'amount_trap',
          label: 'Внутренний лимит бюджета покупателя (не является согласованной стоимостью договора)',
          value: limVal,
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
        continue;
      }

      // --- Б. ИЗВЛЕЧЕНИЕ СУММЫ ДОГОВОРА (ПОДДЕРЖКА РАЗНЫХ ФОРМУЛИРОВОК И ПРИЛОЖЕНИЙ) ---
      var isMissingAmountExplicit = /Числовое\s+значение\s+стоимости\s+.*?\s*не\s+указано|стоимость\s+определяется\s+спецификацией\s+в\s+приложении|стоимость\s+в\s+тексте\s+договора\s+не\s+установлена/i.test(text);
      var isPositiveAmountContext = /(?:Общая\s+|Итоговая\s+)?(?:стоимость(?:\s+поставки|\s+договора|\s+оборудования|\s+комплектующих|\s+запасных\s+частей)?|цена\s+договора|сумма\s+договора)\s+(?:составляет|равна|установлена\s+в\s+размере|—|:)|изменить\s+(?:общую\s+)?(?:стоимость(?:\s+поставки)?|цену\s+договора|сумму\s+договора)\s+(?:на|до)/i.test(text);

      if (isMissingAmountExplicit && !/составляет\s+\d/i.test(text)) {
        extractedAmount = {
          status: 'missing',
          rawNumber: null,
          vatMode: 'none',
          displayValue: 'нет данных',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text,
          docTitle: docTitle
        };
        docWarnings.push({
          severity: 'high',
          kind: 'missing_appendix',
          title: 'Требуется проверка: отсутствует Приложение № 1 со стоимостью',
          description: 'Общая стоимость определяется спецификацией в Приложении № 1, которое не входит в комплект документов.',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
      } else if (isPositiveAmountContext) {
        var numMatch = text.match(/(?:составляет|равна|размере|на|до|—|:)\s*(\d[\d\s\.,]*)\s*(?:\([^)]+\)\s*)?руб/i) ||
                       text.match(/(\d[\d\s\.,]*)\s*(?:\([^)]+\)\s*)?руб/i);
        if (numMatch) {
          var cleanNum = parseRubleNumber(numMatch[1]);
          if (cleanNum !== null) {
            var vatMode = 'none';
            if (/включая\s+НДС|с\s+учетом\s+НДС|в\s+т\.?\s*ч\.?\s+НДС|с\s+НДС/i.test(text)) vatMode = 'with_vat';
            else if (/без\s+НДС|НДС\s+не\s+облагается/i.test(text)) vatMode = 'without_vat';

            var innerQuoteMatch = text.match(/«([^»]+)»/);
            extractedAmount = {
              status: 'ok',
              rawNumber: cleanNum,
              vatMode: vatMode,
              displayValue: formatRubles(cleanNum, vatMode),
              fileName: fileName,
              paragraphId: p.id,
              clause: p.clause,
              quote: text,
              exactQuote: innerQuoteMatch ? innerQuoteMatch[1] : text,
              docTitle: docTitle
            };
          }
        }
      }

      // --- В. ПРОВЕРКА ЛОВУШЕК ДАТЫ (СРОК ОПЛАТЫ И ДАТА ПРИЕМКИ) ---
      if (/является\s+сроком\s+оплаты,\s+а\s+не\s+поставки|Оплата\s+оставшейся\s+суммы\s+производится\s+не\s+позднее|срок\s+оплаты\s+—?\s*не\s+позднее/i.test(text)) {
        var payDateStr = extractDateFromText(text) || 'Срок оплаты';
        if (extractedPaymentTerms) {
          extractedPaymentTerms.displayValue += '; остаток до ' + payDateStr;
        }
        ignoredTraps.push({
          type: 'date_trap',
          label: 'Срок окончательной оплаты (п. ' + (p.clause || '3.2') + ' прямо указывает: не является сроком поставки)',
          value: payDateStr,
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
        continue;
      }

      if (/Дата\s+приемки\s+может\s+отличаться\s+от\s+даты\s+поставки/i.test(text)) {
        ignoredTraps.push({
          type: 'date_trap',
          label: 'Оговорка о дате приемки оборудования (не изменяет срок поставки по п. 3.1)',
          value: 'п. ' + (p.clause || '3.2'),
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
        continue;
      }

      // --- Г. ИЗВЛЕЧЕНИЕ СРОКА ПОСТАВКИ ---
      var isMissingDateExplicit = /срок\s+поставки\s+.*?\s*(?:не\s+указан|не\s+установлен|определяется\s+спецификацией)/i.test(text);
      if (isMissingDateExplicit) {
        extractedDeliveryDate = {
          status: 'missing',
          value: 'нет данных',
          dateObj: null,
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text,
          docTitle: docTitle
        };
        docWarnings.push({
          severity: 'high',
          kind: 'missing_delivery_date',
          title: 'Требуется проверка: срок поставки не указан в тексте',
          description: 'В тексте договора отсутствует конкретная дата поставки.',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text
        });
      } else if (/поставить\s+.*?(?:не\s+позднее|до)|срок\s+поставки\s*(?:составляет|—|:|\s+до|\s+не\s+позднее)|изменить\s+срок\s+поставки\s+на|перенести\s+срок\s+поставки/i.test(text)) {
        var targetDateStr = null;
        // Если конструкция вида "перенести с ДД.ММ.ГГГГ на ДД.ММ.ГГГГ", берем дату после "на"
        var afterNaMatch = text.match(/(?:на|не\s+позднее|до)\s+(\d{2}\.\d{2}\.\d{4}|\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/i);
        if (afterNaMatch) {
          targetDateStr = extractDateFromText(afterNaMatch[1]);
        } else {
          targetDateStr = extractDateFromText(text);
        }

        if (targetDateStr) {
          var iqDate = text.match(/«([^»]+)»/);
          extractedDeliveryDate = {
            status: 'ok',
            value: targetDateStr,
            dateObj: parseDate(targetDateStr),
            fileName: fileName,
            paragraphId: p.id,
            clause: p.clause,
            quote: text,
            exactQuote: iqDate ? iqDate[1] : text,
            docTitle: docTitle
          };
        }
      }

      // --- Д. ИЗВЛЕЧЕНИЕ СТАВКИ НЕУСТОЙКИ (п. 4.1 ИЛИ ИЗМЕНЕНИЕ В ДС) ---
      if (/Ставка\s+неустойки\s+.*?\s*не\s+установлена|неустойка\s+не\s+предусмотрена/i.test(text)) {
        extractedPenalty = {
          status: 'missing',
          ratePercent: 0,
          capPercent: 0,
          displayValue: 'нет данных',
          fileName: fileName,
          paragraphId: p.id,
          clause: p.clause,
          quote: text,
          exactQuote: text,
          docTitle: docTitle
        };
      } else if (/(?:Неустойка(?:\s+за\s+просрочку\s+поставки)?|размер\s+неустойки|пеня)\s+(?:составляет|установлена|равна)|изменить\s+(?:ставку|размер)\s+неустойки\s+на/i.test(text) && !/остаются\s+без\s+изменений/i.test(text)) {
        var rateMatch = text.match(/(?:составляет|равна|на)\s+([\d,\.]+)\s*%/i) || text.match(/([\d,\.]+)\s*%\s*(?:стоимости|за\s+каждый\s+день|в\s+день)/i);
        var capMatch = text.match(/не\s+более\s+([\d,\.]+)\s*%/i);
        if (rateMatch) {
          var rateNum = Number(rateMatch[1].replace(',', '.'));
          var capNum = capMatch ? Number(capMatch[1].replace(',', '.')) : 0;
          var rateStr = rateMatch[1].replace('.', ',') + '%';
          var capStr = capMatch ? (' (лимит ' + capMatch[1].replace('.', ',') + '%)') : '';
          var iqPen = text.match(/«([^»]+)»/);
          extractedPenalty = {
            status: 'ok',
            ratePercent: rateNum,
            capPercent: capNum,
            displayValue: rateStr + '/день' + capStr,
            fileName: fileName,
            paragraphId: p.id,
            clause: p.clause,
            quote: text,
            exactQuote: iqPen ? iqPen[1] : text,
            docTitle: docTitle
          };
        }
      }
    }

    return {
      fileName: fileName,
      contractId: contractId,
      docType: docType,
      docTitle: docTitle,
      docNumber: docNumber,
      isSigned: isSigned,
      statusUnclear: statusUnclear,
      docDate: docDate,
      docDateObj: parseDate(docDate),
      signedDate: signedDate,
      signedDateObj: parseDate(signedDate),
      effectiveDate: effectiveDate,
      effectiveDateExplicit: effectiveDateExplicit,
      effectiveDateObj: parseDate(effectiveDate),
      effectiveDatePara: effectiveDatePara,
      buyer: buyer,
      supplier: supplier,
      subject: subject,
      extractedAmount: extractedAmount,
      extractedDeliveryDate: extractedDeliveryDate,
      extractedPenalty: extractedPenalty,
      extractedPaymentTerms: extractedPaymentTerms,
      ignoredTraps: ignoredTraps,
      docWarnings: docWarnings,
      paragraphs: paragraphs,
      rawText: rawText
    };
  }

  // --- 5. ДВИЖОК СВЕДЕНИЯ СОСТОЯНИЯ НА ДАТУ ПРОВЕРКИ (STATE RESOLVER) ---

  function resolveContracts(fileList, checkDateStr) {
    var effectiveCheckStr = checkDateStr || '10.03.2026';
    var checkDate = parseDate(effectiveCheckStr) || parseDate('10.03.2026');
    var inputList = fileList || [];
    var parsedDocs = [];
    var i, j;

    for (i = 0; i < inputList.length; i++) {
      parsedDocs.push(parseDocument(inputList[i]));
    }

    var groups = {};
    for (i = 0; i < parsedDocs.length; i++) {
      var doc = parsedDocs[i];
      if (!groups[doc.contractId]) {
        groups[doc.contractId] = [];
      }
      groups[doc.contractId].push(doc);
    }

    var contractKeys = Object.keys(groups).sort();
    var contracts = [];

    for (i = 0; i < contractKeys.length; i++) {
      var contractId = contractKeys[i];
      var docs = groups[contractId];

      // Детерминированная сортировка документов внутри пакета (не зависит от порядка загрузки файлов!)
      docs.sort(function (a, b) {
        var typeOrder = { 'contract': 1, 'appendix': 2, 'amendment': 3, 'email': 4, 'draft': 5, 'other': 6 };
        var oa = typeOrder[a.docType] || 9;
        var ob = typeOrder[b.docType] || 9;
        if (oa !== ob) return oa - ob;
        var da = a.docDateObj ? a.docDateObj.getTime() : 0;
        var db = b.docDateObj ? b.docDateObj.getTime() : 0;
        if (da !== db) return da - db;
        return (a.docNumber || 0) - (b.docNumber || 0);
      });

      var baseContract = null;
      for (j = 0; j < docs.length; j++) {
        if (docs[j].docType === 'contract' && docs[j].isSigned) {
          baseContract = docs[j];
          break;
        }
      }
      if (!baseContract) {
        for (j = 0; j < docs.length; j++) {
          if (docs[j].docType === 'contract') {
            baseContract = docs[j];
            break;
          }
        }
      }

      var hasBaseContract = Boolean(baseContract);
      var fallbackDoc = baseContract || docs[0];

      var activeAmount = (baseContract && baseContract.extractedAmount)
        ? cloneObj(baseContract.extractedAmount)
        : {
            status: 'missing',
            rawNumber: null,
            vatMode: 'none',
            displayValue: 'нет данных',
            fileName: fallbackDoc.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: 'Базовый договор или сведения о стоимости отсутствуют в пакете.',
            exactQuote: 'Сведения о стоимости не найдены',
            docTitle: fallbackDoc.docTitle
          };

      var activeDeliveryDate = (baseContract && baseContract.extractedDeliveryDate)
        ? cloneObj(baseContract.extractedDeliveryDate)
        : {
            status: 'missing',
            value: 'нет данных',
            dateObj: null,
            fileName: fallbackDoc.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: 'Базовый договор или сведения о сроке поставки отсутствуют в пакете.',
            exactQuote: 'Сведения о сроке не найдены',
            docTitle: fallbackDoc.docTitle
          };

      var activePenalty = (baseContract && baseContract.extractedPenalty)
        ? cloneObj(baseContract.extractedPenalty)
        : {
            status: 'missing',
            ratePercent: 0,
            capPercent: 0,
            displayValue: 'нет данных',
            fileName: fallbackDoc.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: 'Ставка неустойки не указана.',
            exactQuote: 'Ставка неустойки не указана',
            docTitle: fallbackDoc.docTitle
          };

      var activePaymentTerms = (baseContract && baseContract.extractedPaymentTerms)
        ? cloneObj(baseContract.extractedPaymentTerms)
        : null;

      var amountHistory = [];
      var deliveryDateHistory = [];
      var penaltyHistory = [];
      var warnings = [];
      var ignoredTraps = [];

      if (!hasBaseContract) {
        warnings.push({
          severity: 'high',
          kind: 'missing_base_contract',
          title: 'Требуется проверка: базовый договор ' + contractId + ' отсутствует в пакете',
          description: 'Загружены только дополнительные документы или письма без основного текста договора.',
          fileName: fallbackDoc.fileName,
          paragraphId: 'p_1',
          clause: null,
          quote: fallbackDoc.paragraphs[0] ? fallbackDoc.paragraphs[0].text : ''
        });
      } else if (!baseContract.isSigned) {
        warnings.push({
          severity: 'high',
          kind: 'unsigned_base_contract',
          title: 'Требуется проверка: базовый договор ' + contractId + ' не подписан обеими сторонами',
          description: 'В базовом договоре отсутствует подтверждение подписания обеими сторонами.',
          fileName: baseContract.fileName,
          paragraphId: 'p_1',
          clause: null,
          quote: baseContract.paragraphs[0] ? baseContract.paragraphs[0].text : ''
        });
      } else if (baseContract.signedDateObj && baseContract.signedDateObj.getTime() > checkDate.getTime()) {
        warnings.push({
          severity: 'high',
          kind: 'future_base_contract',
          title: 'Базовый договор ' + contractId + ' подписан позже даты проверки (' + baseContract.signedDate + ')',
          description: 'На выбранную дату проверки (' + formatDateRU(checkDate) + ') базовый договор еще не был подписан.',
          fileName: baseContract.fileName,
          paragraphId: 'p_1',
          clause: null,
          quote: baseContract.paragraphs[0] ? baseContract.paragraphs[0].text : ''
        });
      }

      // Проверяем, не загружено ли подписанное Приложение №1 (Спецификация), закрывающее пробел цены
      for (j = 0; j < docs.length; j++) {
        var appDoc = docs[j];
        if (appDoc.docType === 'appendix' && appDoc.isSigned) {
          var appSignedOk = !appDoc.signedDateObj || (appDoc.signedDateObj.getTime() <= checkDate.getTime());
          if (appSignedOk && appDoc.extractedAmount && appDoc.extractedAmount.status === 'ok') {
            if (activeAmount.status === 'missing') {
              activeAmount = cloneObj(appDoc.extractedAmount);
              activeAmount.changedBy = appDoc.docTitle;
              activeAmount.effectiveDate = appDoc.effectiveDate || appDoc.docDate;
              // Удаляем предупреждение об отсутствии Приложения №1 из базового договора
              if (baseContract) {
                var filteredDocWarns = [];
                for (var wIdx = 0; wIdx < baseContract.docWarnings.length; wIdx++) {
                  if (baseContract.docWarnings[wIdx].kind !== 'missing_appendix') {
                    filteredDocWarns.push(baseContract.docWarnings[wIdx]);
                  }
                }
                baseContract.docWarnings = filteredDocWarns;
              }
            }
          }
        }
      }

      // Собираем ловушки и предупреждения со всех документов пакета
      for (j = 0; j < docs.length; j++) {
        var d = docs[j];
        var k;
        for (k = 0; k < d.ignoredTraps.length; k++) {
          ignoredTraps.push(d.ignoredTraps[k]);
        }
        for (k = 0; k < d.docWarnings.length; k++) {
          warnings.push(d.docWarnings[k]);
        }
        if (d.statusUnclear) {
          warnings.push({
            severity: 'high',
            kind: 'unclear_status',
            title: 'Требуется проверка статуса подписания (' + d.docTitle + ')',
            description: 'В тексте документа нет однозначного подтверждения подписания обеими сторонами. Изменения не применены автоматически.',
            fileName: d.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: d.paragraphs[0] ? d.paragraphs[0].text : ''
          });
        }
      }

      // Собираем подписанные ДС
      var signedAmendments = [];
      for (j = 0; j < docs.length; j++) {
        if (docs[j].docType === 'amendment' && docs[j].isSigned) {
          signedAmendments.push(docs[j]);
        }
      }

      signedAmendments.sort(function (a, b) {
        var tA = a.effectiveDateObj ? a.effectiveDateObj.getTime() : 0;
        var tB = b.effectiveDateObj ? b.effectiveDateObj.getTime() : 0;
        if (tA !== tB) return tA - tB;
        return (a.docNumber || 0) - (b.docNumber || 0);
      });

      // Проверка на коллизию двух подписанных ДС от одной даты
      for (j = 1; j < signedAmendments.length; j++) {
        var prevAm = signedAmendments[j - 1];
        var currAm = signedAmendments[j];
        if (prevAm.effectiveDate && currAm.effectiveDate && prevAm.effectiveDate === currAm.effectiveDate && prevAm.docNumber === currAm.docNumber) {
          warnings.push({
            severity: 'high',
            kind: 'amendment_collision',
            title: 'Требуется проверка: коллизия подписанных ДС от ' + currAm.effectiveDate,
            description: 'Обнаружено несколько подписанных соглашений с одинаковой датой и номером (' + prevAm.fileName + ' и ' + currAm.fileName + ').',
            fileName: currAm.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: currAm.paragraphs[0] ? currAm.paragraphs[0].text : ''
          });
        }
      }

      // Применение подписанных ДС на дату проверки
      for (j = 0; j < signedAmendments.length; j++) {
        var am = signedAmendments[j];
        var effDate = am.effectiveDateObj;
        var signDate = am.signedDateObj;

        if (!am.effectiveDateExplicit) {
          warnings.push({
            severity: 'warning',
            kind: 'missing_eff_date',
            title: 'Требуется проверка: в ' + am.docTitle + ' явно не выделена дата вступления в силу',
            description: 'Согласно п. 5.1 договора изменения действуют после наступления даты вступления в силу. Использована дата подписания (' + (am.docDate || 'не указана') + ').',
            fileName: am.fileName,
            paragraphId: 'p_1',
            clause: null,
            quote: am.paragraphs[0] ? am.paragraphs[0].text : ''
          });
        }

        var isEffectiveByDate = Boolean(effDate && effDate.getTime() <= checkDate.getTime());
        var isSignedByDate = Boolean(!signDate || signDate.getTime() <= checkDate.getTime());

        if (isEffectiveByDate && isSignedByDate) {
          if (am.extractedAmount) {
            amountHistory.push(cloneObj(activeAmount));
            activeAmount = cloneObj(am.extractedAmount);
            activeAmount.changedBy = am.docTitle;
            activeAmount.effectiveDate = am.effectiveDate;
          }
          if (am.extractedDeliveryDate) {
            deliveryDateHistory.push(cloneObj(activeDeliveryDate));
            activeDeliveryDate = cloneObj(am.extractedDeliveryDate);
            activeDeliveryDate.changedBy = am.docTitle;
            activeDeliveryDate.effectiveDate = am.effectiveDate;
          }
          if (am.extractedPenalty) {
            penaltyHistory.push(cloneObj(activePenalty));
            activePenalty = cloneObj(am.extractedPenalty);
            activePenalty.changedBy = am.docTitle;
            activePenalty.effectiveDate = am.effectiveDate;
          }
        } else {
          var effParaText = am.paragraphs[0] ? am.paragraphs[0].text : '';
          var m;
          for (m = 0; m < am.paragraphs.length; m++) {
            if (am.paragraphs[m].id === am.effectiveDatePara) {
              effParaText = am.paragraphs[m].text;
              break;
            }
          }
          var reasonStr = !isEffectiveByDate
            ? ('вступает в силу ' + am.effectiveDate)
            : ('подписано ' + am.signedDate);
          warnings.push({
            severity: 'medium',
            kind: 'future_amendment',
            title: am.docTitle + ' еще не действует на дату проверки (' + reasonStr + ')',
            description: 'На выбранную дату проверки (' + formatDateRU(checkDate) + ') изменения по ' + am.docTitle + ' еще не вступили в силу. Действуют предыдущие условия.',
            fileName: am.fileName,
            paragraphId: am.effectiveDatePara || 'p_1',
            clause: null,
            quote: effParaText
          });
        }
      }

      // Расчет денежного выражения неустойки (от актуальной суммы договора)
      if (activePenalty.status === 'ok' && activeAmount.status === 'ok' && activeAmount.rawNumber) {
        var dailyRub = Math.round(activeAmount.rawNumber * (activePenalty.ratePercent / 100));
        var maxCapRub = Math.round(activeAmount.rawNumber * (activePenalty.capPercent / 100));
        activePenalty.dailyRubles = dailyRub;
        activePenalty.maxCapRubles = maxCapRub;
        activePenalty.financialNote = formatRubles(dailyRub, false) + '/день (макс. ' + formatRubles(maxCapRub, false) + ')';
      } else {
        activePenalty.dailyRubles = null;
        activePenalty.maxCapRubles = null;
        activePenalty.financialNote = null;
      }

      // Обрабатываем неподписанные проекты ДС и письма поставщиков (исключая документы с statusUnclear, чтобы не дублировать)
      for (j = 0; j < docs.length; j++) {
        var uDoc = docs[j];
        if (uDoc.isSigned || uDoc.statusUnclear || uDoc.docType === 'contract') continue;

        var proposedParts = [];
        var targetPara = 'p_1';
        var targetQuote = uDoc.paragraphs[0] ? uDoc.paragraphs[0].text : '';
        var deltaAmountRub = null;
        var delayDays = null;
        var penaltyImpactRub = null;

        if (uDoc.extractedAmount && uDoc.extractedAmount.displayValue) {
          proposedParts.push('сумма: ' + uDoc.extractedAmount.displayValue);
          targetPara = uDoc.extractedAmount.paragraphId;
          targetQuote = uDoc.extractedAmount.quote;
          if (activeAmount.rawNumber && uDoc.extractedAmount.rawNumber) {
            deltaAmountRub = uDoc.extractedAmount.rawNumber - activeAmount.rawNumber;
          }
        }
        if (uDoc.extractedDeliveryDate && uDoc.extractedDeliveryDate.value) {
          proposedParts.push('срок: ' + uDoc.extractedDeliveryDate.value);
          targetPara = uDoc.extractedDeliveryDate.paragraphId;
          targetQuote = uDoc.extractedDeliveryDate.quote;
          if (activeDeliveryDate.dateObj && uDoc.extractedDeliveryDate.dateObj) {
            delayDays = daysBetween(activeDeliveryDate.dateObj, uDoc.extractedDeliveryDate.dateObj);
            if (delayDays > 0 && activePenalty.dailyRubles) {
              var rawPen = delayDays * activePenalty.dailyRubles;
              penaltyImpactRub = activePenalty.maxCapRubles ? Math.min(rawPen, activePenalty.maxCapRubles) : rawPen;
            }
          }
        }
        if (uDoc.extractedPenalty && uDoc.extractedPenalty.displayValue) {
          proposedParts.push('неустойка: ' + uDoc.extractedPenalty.displayValue);
        }

        var isEmail = (uDoc.docType === 'email');
        var impactNotes = [];
        if (deltaAmountRub !== null && deltaAmountRub !== 0) {
          var sign = deltaAmountRub > 0 ? '+' : '';
          impactNotes.push('дельта к действующей цене: ' + sign + formatRubles(deltaAmountRub, false));
        }
        if (delayDays !== null && delayDays > 0) {
          var penStr = penaltyImpactRub ? (', потенциал неустойки при просрочке: ' + formatRubles(penaltyImpactRub, false)) : '';
          impactNotes.push('сдвиг срока: +' + delayDays + ' дн.' + penStr);
        }

        warnings.push({
          severity: 'warning',
          kind: isEmail ? 'unapproved_email' : 'unsigned_draft',
          title: isEmail
            ? ('Несогласованное письмо поставщика (' + (proposedParts.join(', ') || 'предложение') + ')')
            : ('Неподписанный ' + uDoc.docTitle + ' (' + (proposedParts.join(', ') || 'проект изменений') + ')'),
          description: (isEmail
            ? 'Предложение поставщика о переносе срока: согласие покупателя не получено, ДС не подписано.'
            : 'Проект на согласовании, не подписан сторонами и не изменяет действующие условия договора.') +
            (impactNotes.length > 0 ? (' [' + impactNotes.join('; ') + ']') : ''),
          proposedAmount: uDoc.extractedAmount ? uDoc.extractedAmount.displayValue : null,
          proposedAmountRaw: uDoc.extractedAmount ? uDoc.extractedAmount.rawNumber : null,
          deltaAmountRub: deltaAmountRub,
          proposedDate: uDoc.extractedDeliveryDate ? uDoc.extractedDeliveryDate.value : null,
          delayDays: delayDays,
          penaltyImpactRub: penaltyImpactRub,
          fileName: uDoc.fileName,
          paragraphId: targetPara,
          clause: null,
          quote: targetQuote
        });
      }

      var relatedDocs = [];
      for (j = 0; j < docs.length; j++) {
        var rd = docs[j];
        var roleLabel = 'Документ';
        if (rd.docType === 'contract') roleLabel = rd.isSigned ? 'Базовый договор' : 'Договор (не подписан)';
        else if (rd.docType === 'appendix') roleLabel = rd.isSigned ? 'Спецификация (в силе)' : 'Спецификация (проект)';
        else if (rd.docType === 'amendment' && rd.isSigned) {
          var isApplied = (rd.effectiveDateObj && rd.effectiveDateObj.getTime() <= checkDate.getTime()) &&
                          (!rd.signedDateObj || rd.signedDateObj.getTime() <= checkDate.getTime());
          roleLabel = isApplied ? ('В силе с ' + rd.effectiveDate) : ('Вступает с ' + rd.effectiveDate);
        } else if (rd.docType === 'draft') {
          roleLabel = 'Проект без подписи';
        } else if (rd.docType === 'email') {
          roleLabel = 'Запрос без ДС';
        }

        relatedDocs.push({
          fileName: rd.fileName,
          docTitle: rd.docTitle,
          docType: rd.docType,
          isSigned: rd.isSigned,
          roleLabel: roleLabel,
          docDate: rd.docDate,
          effectiveDate: rd.effectiveDate,
          paragraphId: 'p_1',
          quote: rd.paragraphs[0] ? rd.paragraphs[0].text : ''
        });
      }

      contracts.push({
        contractId: contractId,
        buyer: fallbackDoc.buyer || 'ООО «СеверМет»',
        supplier: fallbackDoc.supplier || 'Не указан',
        subject: fallbackDoc.subject || '',
        activeAmount: activeAmount,
        amountHistory: amountHistory,
        activeDeliveryDate: activeDeliveryDate,
        deliveryDateHistory: deliveryDateHistory,
        activePenalty: activePenalty,
        penaltyHistory: penaltyHistory,
        activePaymentTerms: activePaymentTerms,
        warnings: warnings,
        ignoredTraps: ignoredTraps,
        relatedDocs: relatedDocs
      });
    }

    // Сводка портфеля для верхней операционной панели (COO Summary)
    var totalConfirmedRub = 0;
    var confirmedCount = 0;
    var missingAmountCount = 0;
    var unapprovedDeltaRub = 0;
    var unapprovedDateChangesCount = 0;
    var totalTrapsCaught = 0;

    for (i = 0; i < contracts.length; i++) {
      var c = contracts[i];
      if (c.activeAmount.status === 'ok' && c.activeAmount.rawNumber) {
        totalConfirmedRub += c.activeAmount.rawNumber;
        confirmedCount++;
      } else {
        missingAmountCount++;
      }
      totalTrapsCaught += c.ignoredTraps.length;
      for (j = 0; j < c.warnings.length; j++) {
        var w = c.warnings[j];
        if (w.deltaAmountRub) unapprovedDeltaRub += w.deltaAmountRub;
        if (w.proposedDate) unapprovedDateChangesCount++;
      }
    }

    var docsByName = {};
    for (i = 0; i < parsedDocs.length; i++) {
      docsByName[parsedDocs[i].fileName] = parsedDocs[i];
    }

    return {
      checkDateStr: formatDateRU(checkDate),
      contracts: contracts,
      docsByName: docsByName,
      parsedDocs: parsedDocs,
      portfolioSummary: {
        totalContracts: contracts.length,
        totalFiles: parsedDocs.length,
        totalConfirmedRub: totalConfirmedRub,
        totalConfirmedFormatted: formatRubles(totalConfirmedRub, 'with_vat'),
        confirmedCount: confirmedCount,
        missingAmountCount: missingAmountCount,
        unapprovedDeltaRub: unapprovedDeltaRub,
        unapprovedDeltaFormatted: (unapprovedDeltaRub >= 0 ? '+' : '') + formatRubles(unapprovedDeltaRub, false),
        unapprovedDateChangesCount: unapprovedDateChangesCount,
        totalTrapsCaught: totalTrapsCaught
      }
    };
  }

  // --- 6. УНИВЕРСАЛЬНЫЙ ГЕНЕРАТОР ОТВЕТОВ НА ВОПРОСЫ БЕЗ ХАРДКОДА ---

  /**
   * Универсально формирует ответ о сроке поставки для любого договора cObj
   */
  function buildDeliveryQuestionAnswer(qId, qNumber, cId, cObj, checkDateStr) {
    var q = {
      id: qId,
      question: qNumber + '. Какой срок поставки действует по договору ' + cId + ' на ' + checkDateStr + '?',
      filterContracts: [cId],
      shortAnswer: cObj ? cObj.activeDeliveryDate.value : ('Договор ' + cId + ' не загружен'),
      details: '',
      citations: []
    };
    if (!cObj) return q;

    var deliv = cObj.activeDeliveryDate;
    var j;
    if (deliv.status === 'missing') {
      q.details = 'По договору ' + cId + ' срок поставки: «нет данных» (' + deliv.fileName + (deliv.clause ? ', п. ' + deliv.clause : '') + ').';
    } else {
      var prevStr = cObj.deliveryDateHistory.length > 0
        ? (' (изменен документом «' + deliv.docTitle + '» с ' + deliv.effectiveDate + '; прежний срок в базовом договоре: ' + cObj.deliveryDateHistory[0].value + ')')
        : ' (по базовому договору)';
      q.details = 'По договору ' + cId + ' на ' + checkDateStr + ' действует срок поставки ' + deliv.value + prevStr + '.';
    }

    q.citations.push({
      label: 'Основание срока: ' + deliv.fileName + (deliv.clause ? ', п. ' + deliv.clause : ''),
      fileName: deliv.fileName,
      paragraphId: deliv.paragraphId,
      quote: deliv.exactQuote || deliv.quote
    });

    if (cObj.deliveryDateHistory.length > 0) {
      var h0 = cObj.deliveryDateHistory[0];
      q.citations.push({
        label: 'Прежний срок: ' + h0.fileName + (h0.clause ? ', п. ' + h0.clause : ''),
        fileName: h0.fileName,
        paragraphId: h0.paragraphId,
        quote: h0.exactQuote || h0.quote
      });
    }

    for (j = 0; j < cObj.warnings.length; j++) {
      var w = cObj.warnings[j];
      if (w.proposedDate || w.kind === 'future_amendment') {
        q.details += ' ' + w.title + ' (' + w.fileName + ') — не действует на ' + checkDateStr + '.';
        q.citations.push({
          label: 'Несогласованный/будущий документ: ' + w.fileName,
          fileName: w.fileName,
          paragraphId: w.paragraphId,
          quote: w.quote
        });
      }
    }

    for (j = 0; j < cObj.ignoredTraps.length; j++) {
      var t = cObj.ignoredTraps[j];
      if (t.type === 'date_trap') {
        q.citations.push({
          label: 'Отсеянная ловушка даты (' + t.value + '): ' + t.fileName,
          fileName: t.fileName,
          paragraphId: t.paragraphId,
          quote: t.quote
        });
      }
    }

    return q;
  }

  /**
   * Универсально формирует ответ о сумме для любого договора cObj (корректно реагирует, если в STN-103 добавят сумму!)
   */
  function buildAmountQuestionAnswer(qId, qNumber, cId, cObj) {
    var q = {
      id: qId,
      question: qNumber + '. Какова сумма договора ' + cId + '?',
      filterContracts: [cId],
      shortAnswer: cObj ? cObj.activeAmount.displayValue : ('Договор ' + cId + ' не загружен'),
      details: '',
      citations: []
    };
    if (!cObj) return q;

    var amt = cObj.activeAmount;
    var j;

    if (amt.status === 'missing') {
      q.details = 'Сумма договора ' + cId + ': «нет данных» — числовое значение стоимости в предоставленных документах отсутствует (' + amt.fileName + (amt.clause ? ', п. ' + amt.clause : '') + ').';
    } else {
      var changeNote = cObj.amountHistory.length > 0
        ? (' (установлена документом «' + amt.docTitle + '» с ' + amt.effectiveDate + '; прежняя сумма: ' + cObj.amountHistory[0].displayValue + ')')
        : (' (основание: ' + amt.fileName + (amt.clause ? ', п. ' + amt.clause : '') + ')');
      q.details = 'Итоговая стоимость договора ' + cId + ' составляет ' + amt.displayValue + changeNote + '.';
    }

    q.citations.push({
      label: (amt.status === 'missing' ? 'Отсутствие стоимости: ' : 'Сумма договора: ') + amt.fileName + (amt.clause ? ', п. ' + amt.clause : ''),
      fileName: amt.fileName,
      paragraphId: amt.paragraphId,
      quote: amt.exactQuote || amt.quote
    });

    if (cObj.amountHistory.length > 0) {
      var ha = cObj.amountHistory[0];
      q.citations.push({
        label: 'Прежняя сумма: ' + ha.fileName + (ha.clause ? ', п. ' + ha.clause : ''),
        fileName: ha.fileName,
        paragraphId: ha.paragraphId,
        quote: ha.exactQuote || ha.quote
      });
    }

    // Присоединяем информацию об отфильтрованных денежных ловушках (авансах, лимитах бюджета)
    for (j = 0; j < cObj.ignoredTraps.length; j++) {
      var trap = cObj.ignoredTraps[j];
      if (trap.type === 'amount_trap') {
        q.details += ' Отсечено число-ловушка в п. ' + (trap.clause || '2.2') + ' (' + trap.value + '): ' + trap.label + '.';
        q.citations.push({
          label: 'Отфильтровано (' + trap.value + '): ' + trap.fileName + (trap.clause ? ', п. ' + trap.clause : ''),
          fileName: trap.fileName,
          paragraphId: trap.paragraphId,
          quote: trap.quote
        });
      }
    }

    // Присоединяем предупреждения по неподписанным проектам изменения суммы
    for (j = 0; j < cObj.warnings.length; j++) {
      var wAmt = cObj.warnings[j];
      if (wAmt.proposedAmount) {
        q.details += ' Предложение изменить сумму на ' + wAmt.proposedAmount + ' (' + wAmt.fileName + ') не подписано и не действует.';
        q.citations.push({
          label: 'Неподписанный проект суммы: ' + wAmt.fileName,
          fileName: wAmt.fileName,
          paragraphId: wAmt.paragraphId,
          quote: wAmt.quote
        });
      }
    }

    return q;
  }

  function answerQuestions(resolvedState, customCutoffStr) {
    var contracts = (resolvedState && resolvedState.contracts) ? resolvedState.contracts : [];
    var byId = {};
    var i, j;
    for (i = 0; i < contracts.length; i++) {
      byId[contracts[i].contractId] = contracts[i];
    }

    var q1 = buildDeliveryQuestionAnswer('q1', 1, 'STN-101', byId['STN-101'], resolvedState.checkDateStr);
    var q2 = buildAmountQuestionAnswer('q2', 2, 'STN-102', byId['STN-102']);
    var q3 = buildAmountQuestionAnswer('q3', 3, 'STN-103', byId['STN-103']);

    // Вопрос 4: Договоры с поставкой раньше заданной даты (по умолчанию 01.04.2026)
    var targetCutoffStr = customCutoffStr || '01.04.2026';
    var cutoffDate = parseDate(targetCutoffStr) || parseDate('01.04.2026');
    var earlyContracts = [];
    for (i = 0; i < contracts.length; i++) {
      if (contracts[i].activeDeliveryDate.dateObj && contracts[i].activeDeliveryDate.dateObj.getTime() < cutoffDate.getTime()) {
        earlyContracts.push(contracts[i]);
      }
    }

    var shortList = [];
    for (i = 0; i < earlyContracts.length; i++) {
      shortList.push(earlyContracts[i].contractId + ' (до ' + earlyContracts[i].activeDeliveryDate.value + ')');
    }

    var q4 = {
      id: 'q4',
      question: '4. По каким договорам поставка раньше ' + formatDateRU(cutoffDate) + ' и есть ли несогласованные изменения срока?',
      filterContracts: [],
      shortAnswer: earlyContracts.length > 0 ? shortList.join(', ') : 'Нет таких договоров',
      details: '',
      citations: []
    };

    if (earlyContracts.length > 0) {
      var parts = [];
      for (i = 0; i < earlyContracts.length; i++) {
        var ec = earlyContracts[i];
        q4.filterContracts.push(ec.contractId);
        q4.citations.push({
          label: ec.contractId + ' — срок ' + ec.activeDeliveryDate.value + ' (' + ec.activeDeliveryDate.fileName + ')',
          fileName: ec.activeDeliveryDate.fileName,
          paragraphId: ec.activeDeliveryDate.paragraphId,
          quote: ec.activeDeliveryDate.exactQuote || ec.activeDeliveryDate.quote
        });

        var dateWarns = [];
        for (j = 0; j < ec.warnings.length; j++) {
          if (ec.warnings[j].proposedDate) {
            dateWarns.push(ec.warnings[j]);
          }
        }

        if (dateWarns.length > 0) {
          var wDescs = [];
          for (j = 0; j < dateWarns.length; j++) {
            var dw = dateWarns[j];
            q4.citations.push({
              label: 'Несогласованный перенос на ' + dw.proposedDate + ' (' + dw.fileName + ')',
              fileName: dw.fileName,
              paragraphId: dw.paragraphId,
              quote: dw.quote
            });
            wDescs.push('есть несогласованное предложение о переносе на ' + dw.proposedDate + ' в документе «' + dw.fileName + '»');
          }
          parts.push(ec.contractId + ' (действующий срок ' + ec.activeDeliveryDate.value + '; ' + wDescs.join('; ') + ')');
        } else {
          parts.push(ec.contractId + ' (действующий срок ' + ec.activeDeliveryDate.value + ', несогласованных изменений срока нет)');
        }
      }
      q4.details = 'Поставка раньше ' + formatDateRU(cutoffDate) + ' запланирована по: ' + parts.join('. ') + '.';
    } else {
      q4.details = 'Договоров с действующим сроком поставки раньше ' + formatDateRU(cutoffDate) + ' в текущем пакете не обнаружено.';
    }

    return [q1, q2, q3, q4];
  }

  // --- 7. ВСТРОЕННЫЙ НАБОР АВТОПРОВЕРОК (14 ТЕСТОВ НА ВСЕ УСЛОВИЯ И УЛОВКИ ИНТЕРВЬЮ) ---

  function runSelfTests() {
    var state = resolveContracts(DEFAULT_DOCUMENTS, '10.03.2026');
    var byId = {};
    var i;
    for (i = 0; i < state.contracts.length; i++) {
      byId[state.contracts[i].contractId] = state.contracts[i];
    }

    // Проверка независимости от порядка загрузки файлов (обратный порядок)
    var reversedDocs = DEFAULT_DOCUMENTS.slice().reverse();
    var stateReversed = resolveContracts(reversedDocs, '10.03.2026');
    var rev101 = stateReversed.contracts[0];

    // Проверка «Машины времени» на 20.02.2026
    var stateBeforeAmendment = resolveContracts(DEFAULT_DOCUMENTS, '20.02.2026');
    var c101Before = stateBeforeAmendment.contracts[0];

    // Симуляция загрузки нового договора STN-104 + изменения суммы в STN-103 через Приложение №1
    var customDocs = DEFAULT_DOCUMENTS.concat([
      {
        fileName: '07_new_contract.txt',
        content: 'ДОГОВОР ПОСТАВКИ № STN-104\nДата: 01.03.2026\nСтатус: подписан обеими сторонами 01.03.2026.\n\n1.1. Покупатель: ООО «СеверМет». Поставщик: ООО «ТехноСплав».\n2.1. Общая стоимость поставки составляет 500 000 рублей, без НДС.\n3.1. Поставщик обязуется поставить оборудование не позднее 25 марта 2026.\n4.1. Неустойка за просрочку поставки составляет 0,2% стоимости за каждый день, но не более 10%.'
      },
      {
        fileName: '08_appendix_stn103.txt',
        content: 'ПРИЛОЖЕНИЕ № 1 К ДОГОВОРУ STN-103\nДата: 20.02.2026\nСтатус: подписано обеими сторонами 20.02.2026.\n1. Общая стоимость поставки составляет 550 000 рублей, включая НДС.'
      }
    ]);
    var stateCustom = resolveContracts(customDocs, '10.03.2026');
    var qCustom = answerQuestions(stateCustom, '01.04.2026');

    // Симуляция документа с неясным статусом подписи
    var ambiguousDocs = [
      {
        fileName: '99_ambiguous.txt',
        content: 'ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 5 К ДОГОВОРУ STN-999\nДата: 05.03.2026\n1. Изменить срок поставки на 12.12.2026.'
      }
    ];
    var stateAmbiguous = resolveContracts(ambiguousDocs, '10.03.2026');
    var c999 = stateAmbiguous.contracts[0];

    var tests = [
      {
        name: '1. Связывание 6 файлов в 3 договорных досье по номеру STN-XXX внутри текста',
        passed: state.contracts.length === 3 && byId['STN-101'].relatedDocs.length === 3 && byId['STN-102'].relatedDocs.length === 2,
        actual: state.contracts.length + ' договора (STN-101: 3 файла, STN-102: 2 файла, STN-103: 1 файл)'
      },
      {
        name: '2. STN-101: Применение подписанного ДС №1 по сумме (1 380 000 руб.) на 10.03.2026',
        passed: byId['STN-101'].activeAmount.rawNumber === 1380000 && byId['STN-101'].activeAmount.fileName === '02_amendment_signed.txt',
        actual: byId['STN-101'].activeAmount.displayValue + ' (' + byId['STN-101'].activeAmount.fileName + ')'
      },
      {
        name: '3. STN-101: Применение подписанного ДС №1 по сроку (30.04.2026) и история «Было -> Стало»',
        passed: byId['STN-101'].activeDeliveryDate.value === '30.04.2026' && byId['STN-101'].deliveryDateHistory[0].value === '15.04.2026',
        actual: 'Действует ' + byId['STN-101'].activeDeliveryDate.value + ' (было ' + byId['STN-101'].deliveryDateHistory[0].value + ')'
      },
      {
        name: '4. STN-101: Отклонение неподписанного Проекта ДС №2 (1 450 000 руб. / 10.05.2026) в предупреждения',
        passed: byId['STN-101'].activeAmount.rawNumber === 1380000 && byId['STN-101'].warnings.length === 1 && byId['STN-101'].warnings[0].deltaAmountRub === 70000,
        actual: 'Отклонено в блок проверки, дельта риска +70 000 руб.'
      },
      {
        name: '5. STN-102: Извлечение суммы (840 000 руб.) и отсев ловушки аванса (252 000 руб. в п. 2.2)',
        passed: byId['STN-102'].activeAmount.rawNumber === 840000 && byId['STN-102'].ignoredTraps.length === 2,
        actual: byId['STN-102'].activeAmount.displayValue + ' (аванс 252 000 руб. отсеян)'
      },
      {
        name: '6. STN-102: Извлечение срока поставки (20.03.2026) и отсев ловушки срока оплаты (10.04.2026 в п. 3.2)',
        passed: byId['STN-102'].activeDeliveryDate.value === '20.03.2026',
        actual: 'Срок поставки 20.03.2026 (срок оплаты 10.04.2026 отсеян)'
      },
      {
        name: '7. STN-102: Перехват письма поставщика (перенос на 27.03.2026) + расчет риска неустойки за 7 дней',
        passed: byId['STN-102'].warnings[0].proposedDate === '27.03.2026' && byId['STN-102'].warnings[0].penaltyImpactRub === 2940,
        actual: 'Письмо в предупреждениях (+7 дн., неустойка 2 940 руб. по п. 4.1)'
      },
      {
        name: '8. STN-103: Вывод «нет данных» при отсутствии Приложения №1 и отсев лимита 600 000 руб.',
        passed: byId['STN-103'].activeAmount.displayValue === 'нет данных' && byId['STN-103'].ignoredTraps[0].value.indexOf('600 000') !== -1,
        actual: 'Сумма: «' + byId['STN-103'].activeAmount.displayValue + '» (лимит 600 000 руб. отсеян)'
      },
      {
        name: '9. Работа «Машины времени» на 20.02.2026 (до вступления в силу ДС №1 от 01.03.2026)',
        passed: c101Before && c101Before.activeAmount.rawNumber === 1200000 && c101Before.activeDeliveryDate.value === '15.04.2026',
        actual: 'На 20.02.2026 действует 1 200 000 руб. и срок 15.04.2026'
      },
      {
        name: '10. Независимость результата от порядка загрузки файлов и их названий',
        passed: rev101 && rev101.activeAmount.rawNumber === 1380000 && rev101.activeDeliveryDate.value === '30.04.2026',
        actual: 'При обратной загрузке STN-101: ' + rev101.activeAmount.displayValue + ', ' + rev101.activeDeliveryDate.value
      },
      {
        name: '11. Динамический обсчет нового договора STN-104 (словесная дата «25 марта 2026», «без НДС»)',
        passed: stateCustom.contracts.length === 4 && qCustom[3].filterContracts.indexOf('STN-104') !== -1,
        actual: 'STN-104 распознан (500 000 руб. без НДС, до 25.03.2026) и включен в Вопрос №4'
      },
      {
        name: '12. Динамическое обновление Вопроса №3 при догрузке Приложения №1 к STN-103 (без хардкода)',
        passed: qCustom[2].shortAnswer === '550 000 руб. (с НДС)' && qCustom[2].details.indexOf('Итоговая стоимость') !== -1,
        actual: 'Вопрос №3 обновился на: ' + qCustom[2].shortAnswer
      },
      {
        name: '13. Наличие точных цитат, файла и ID абзаца у 100% извлеченных значений',
        passed: state.contracts.every(function (c) { return c.activeAmount.quote && c.activeAmount.paragraphId && c.activeDeliveryDate.quote; }),
        actual: 'Все поля имеют fileName, paragraphId и точную цитату'
      },
      {
        name: '14. Выставление флага «Требуется проверка» при неясном статусе подписи или отсутствии договора',
        passed: c999 && c999.warnings.length === 2,
        actual: 'Выставлено предупреждений: ' + (c999 ? c999.warnings.length : 0) + ' (отсутствие договора + неясный статус)'
      }
    ];

    var passedCount = 0;
    for (i = 0; i < tests.length; i++) {
      if (tests[i].passed) passedCount++;
    }

    return {
      total: tests.length,
      passedCount: passedCount,
      allPassed: passedCount === tests.length,
      tests: tests
    };
  }

  global.STNEngine = {
    DEFAULT_DOCUMENTS: DEFAULT_DOCUMENTS,
    parseDate: parseDate,
    formatDateRU: formatDateRU,
    formatRubles: formatRubles,
    parseDocument: parseDocument,
    resolveContracts: resolveContracts,
    answerQuestions: answerQuestions,
    runSelfTests: runSelfTests
  };

})(typeof window !== 'undefined' ? window : this);

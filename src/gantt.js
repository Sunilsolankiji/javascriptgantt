/* =========================================================
 * Created by Sunil Solanki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

// ES6+ Module Imports
import {
  addDays,
  daysBetween,
  stripTime,
  isWeekend,
} from "./utils/dateUtils.js";

import {
  createElement,
  querySelector,
  querySelectorAll,
  addClass,
  removeClass,
  hasClass,
  setStyles,
  getElementPosition,
} from "./utils/domUtils.js";

import {
  deepClone,
  findBy,
  groupBy,
  sortBy,
  hasProperty,
} from "./utils/dataUtils.js";

import {
  isString,
  isNumber,
  isArray,
  isEmpty,
  isFunction,
  checkDuplicateIds,
} from "./utils/validators.js";

import { EventManager } from "./modules/EventManager.js";
import { TaskManager } from "./modules/TaskManager.js";
import { LinkManager } from "./modules/LinkManager.js";
import { ScaleManager } from "./modules/ScaleManager.js";
import { I18nManager } from "./modules/I18nManager.js";

class javascriptgantt {
  #arrangeData = true;
  #ganttHeight = 0;
  #debounceTimers = new Map();
  #searchedData = undefined;
  #eventManager = null;
  #taskManager = null;
  #linkManager = null;
  #scaleManager = null;
  #i18nManager = null;
  #dateFormat = {
    month_full: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    month_short: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    day_full: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    day_short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  };

  constructor(element, options, templates) {
    // Initialize module managers
    this.#eventManager = new EventManager();
    this.#taskManager = new TaskManager(options);
    this.#linkManager = new LinkManager(options);
    this.#scaleManager = new ScaleManager(options);
    this.#i18nManager = new I18nManager(options);

    this.element = element;
    this.initializeOptions(options);
    this.validateInitializationOptions(this.options);
    this.initTemplates(templates);

    this.handleFullScreenChangeSafari =
      this.handleFullScreenChangeSafari.bind(this);
    this.handleFullScreenChange = this.handleFullScreenChange.bind(this);
    this.handleResizeWindow = this.handleResizeWindow.bind(this);

    this.init();
  }

  /**
   * Validates initialization options before processing
   * Uses imported validators from utils/validators.js
   * @private
   * @param {Object} options - Options to validate
   * @throws {Error} If validation fails
   * @returns {void}
   */
  validateInitializationOptions(options) {
    const errors = [];

    if (!options) {
      throw new Error("[javascriptgantt] Options object is required");
    }

    // Validate data using imported isArray
    if (options.data !== undefined && !isArray(options.data)) {
      errors.push("options.data must be an array");
    }

    // Validate dimensions using imported isNumber
    if (options.row_height !== undefined && !isNumber(options.row_height)) {
      errors.push("options.row_height must be a number");
    }

    if (options.sidebarWidth !== undefined && !isNumber(options.sidebarWidth)) {
      errors.push("options.sidebarWidth must be a number");
    }

    if (options.scale_height !== undefined && !isNumber(options.scale_height)) {
      errors.push("options.scale_height must be a number");
    }

    // Validate zoom level using imported isString
    if (options.zoomLevel && !isString(options.zoomLevel)) {
      errors.push("options.zoomLevel must be a string");
    }

    // Validate task data if provided using imported validators
    if (isArray(options.data) && options.data.length > 0) {
      const invalidTasks = options.data.filter(
        (task) => isEmpty(task.id) || !task.name
      );

      if (invalidTasks.length > 0) {
        errors.push(
          `${invalidTasks.length} task(s) missing required 'id' or 'name' property`
        );
      }

      // Check for duplicate task IDs using imported checkDuplicateIds
      const duplicateCheck = checkDuplicateIds(options.data, "id");
      if (duplicateCheck.hasDuplicates) {
        console.warn(
          `[javascriptgantt] Duplicate task IDs detected: ${duplicateCheck.duplicates.join(", ")}`
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `[javascriptgantt] Initialization Error:\n  - ${errors.join("\n  - ")}`
      );
    }
  }

  // initialize Options
  initializeOptions(opt = {}) {
    this.options = {
      date_format: opt.date_format,
      columns: opt.columns || [],
      rightGrid: opt.rightGrid,
      data: opt.data || [],
      collapse: opt.collapse !== false,
      fullWeek: opt.fullWeek !== false,
      todayMarker: opt.todayMarker !== false,
      weekends: opt.weekends || [],
      startDate: opt.startDate,
      endDate: opt.endDate,
      zoomLevel: opt.zoomLevel || "day",
      zoomConfig: opt.zoomConfig || {
        levels: [{ unit: "day", step: 1, format: "%d" }],
      },
      scales: opt.scales || [{ unit: "day", step: 1, format: "%d" }],
      minColWidth: 80,
      openedTasks: [],
      selectedRow: "",
      weekStart: opt.weekStart || 1,
      scale_height: opt.scale_height || 30,
      row_height: opt.row_height || 50,
      sidebarWidth: opt.sidebarWidth || 400,
      customMarker: opt.customMarker || [],
      fullCell: opt.fullCell !== false,
      taskColor: opt.taskColor || false,
      taskOpacity: opt.taskOpacity || 0.8,
      addLinks: opt.addLinks || false,
      exportApi: opt.exportApi,
      updateLinkOnDrag: opt.updateLinkOnDrag !== false,
      splitTask: opt.splitTask || false,
      links: opt.links || [],
      selectAreaOnDrag: opt.selectAreaOnDrag || false,
      taskProgress: opt.taskProgress || true,
      mouseScroll: opt.mouseScroll || false,
      ctrlKeyRequiredForMouseScroll:
        opt.ctrlKeyRequiredForMouseScroll !== false,
      sort: opt.sort || false,
      dropArea: opt.dropArea !== false,
      i18n: {
        hi: {
          month_full: [
            "जनवरी",
            "फ़रवरी",
            "मार्च",
            "अप्रैल",
            "मई",
            "जून",
            "जुलाई",
            "अगस्त",
            "सितंबर",
            "अक्टूबर",
            "नवंबर",
            "दिसंबर",
          ],
          month_short: [
            "जनवरी",
            "फ़रवरी",
            "मार्च",
            "अप्रैल",
            "मई",
            "जून",
            "जुलाई",
            "अगस्त",
            "सितंबर",
            "अक्टूबर",
            "नवंबर",
            "दिसंबर",
          ],
          day_full: [
            "रविवार",
            "सोमवार",
            "मंगलवार",
            "बुधवार",
            "गुरुवार",
            "शुक्रवार",
            "शनिवार",
          ],
          day_short: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
          label: {
            description: "विवरण",
          },
          buttons: {
            save: "जमा करे",
            cancel: "रद्द करे",
            delete: "मिटाये",
          },
        },
        en: {
          month_full: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          day_short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          label: {
            description: "Description",
          },
          buttons: {
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
          },
        },
        fr: {
          month_full: [
            "Janvier",
            "Février",
            "Mars",
            "Avril",
            "Mai",
            "Juin",
            "Juillet",
            "Août",
            "Septembre",
            "Octobre",
            "Novembre",
            "Décembre",
          ],
          month_short: [
            "Jan",
            "Fév",
            "Mar",
            "Avr",
            "Mai",
            "Juin",
            "Juil",
            "Aoû",
            "Sep",
            "Oct",
            "Nov",
            "Déc",
          ],
          day_full: [
            "Dimanche",
            "Lundi",
            "Mardi",
            "Mercredi",
            "Jeudi",
            "Vendredi",
            "Samedi",
          ],
          day_short: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
          label: {
            description: "Description",
          },
          buttons: {
            save: "Sauvegarder",
            cancel: "Annuler",
            delete: "Effacer",
          },
        },
        de: {
          month_full: [
            "Januar",
            "Februar",
            "März ",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September ",
            "Oktober",
            "November ",
            "Dezember",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mär",
            "Apr",
            "Mai",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dez",
          ],
          day_full: [
            "Sonntag",
            "Montag",
            "Dienstag",
            "Mittwoch",
            "Donnerstag",
            "Freitag",
            "Samstag",
          ],
          day_short: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
          label: {
            description: "Beschreibung",
          },
          buttons: {
            save: "Speichern",
            cancel: "Abbrechen",
            delete: "Löschen",
          },
        },
        ja: {
          month_full: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
          ],
          month_short: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
          ],
          day_full: [
            "日曜日",
            "月曜日",
            "火曜日",
            "水曜日",
            "木曜日",
            "金曜日",
            "土曜日",
          ],
          day_short: ["太陽", "月", "火", "結婚した", "木", "金", "土"],
          label: {
            description: "説明",
          },
          buttons: {
            save: "保存する",
            cancel: "キャンセル",
            delete: "削除",
          },
        },
        ar: {
          month_full: [
            "كانون الثاني",
            "شباط",
            "آذار",
            "نيسان",
            "أيار",
            "حزيران",
            "تموز",
            "آب",
            "أيلول",
            "تشرين الأول",
            "تشرين الثاني",
            "كانون الأول",
          ],
          month_short: [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
          ],
          day_full: [
            "الأحد",
            "الأثنين",
            "ألثلاثاء",
            "الأربعاء",
            "ألحميس",
            "ألجمعة",
            "السبت",
          ],
          day_short: [
            "احد",
            "اثنين",
            "ثلاثاء",
            "اربعاء",
            "خميس",
            "جمعة",
            "سبت",
          ],
          label: {
            description: "وصف",
          },
          buttons: {
            save: "يحفظ",
            cancel: "يلغي",
            delete: "يمسح",
          },
        },
        be: {
          month_full: [
            "Студзень",
            "Люты",
            "Сакавік",
            "Красавік",
            "Maй",
            "Чэрвень",
            "Ліпень",
            "Жнівень",
            "Верасень",
            "Кастрычнік",
            "Лістапад",
            "Снежань",
          ],
          month_short: [
            "Студз",
            "Лют",
            "Сак",
            "Крас",
            "Maй",
            "Чэр",
            "Ліп",
            "Жнів",
            "Вер",
            "Каст",
            "Ліст",
            "Снеж",
          ],
          day_full: [
            "Нядзеля",
            "Панядзелак",
            "Аўторак",
            "Серада",
            "Чацвер",
            "Пятніца",
            "Субота",
          ],
          day_short: ["Нд", "Пн", "Аўт", "Ср", "Чцв", "Пт", "Сб"],
          label: {
            description: "Апісанне",
          },
          buttons: {
            save: "Захаваць",
            cancel: "Адмяніць",
            delete: "Выдаліць",
          },
        },
        ca: {
          month_full: [
            "Gener",
            "Febrer",
            "Març",
            "Abril",
            "Maig",
            "Juny",
            "Juliol",
            "Agost",
            "Setembre",
            "Octubre",
            "Novembre",
            "Desembre",
          ],
          month_short: [
            "Gen",
            "Feb",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Oct",
            "Nov",
            "Des",
          ],
          day_full: [
            "Diumenge",
            "Dilluns",
            "Dimarts",
            "Dimecres",
            "Dijous",
            "Divendres",
            "Dissabte",
          ],
          day_short: ["Dg", "Dl", "Dm", "Dc", "Dj", "Dv", "Ds"],
          label: {
            description: "Descripció",
          },
          buttons: {
            save: "Desa",
            cancel: "Cancel · lar",
            delete: "Suprimeix",
          },
        },
        cn: {
          month_full: [
            "一月",
            "二月",
            "三月",
            "四月",
            "五月",
            "六月",
            "七月",
            "八月",
            "九月",
            "十月",
            "十一月",
            "十二月",
          ],
          month_short: [
            "简",
            "二月",
            "三月",
            "四月",
            "可能",
            "君",
            "七月",
            "八月",
            "九月",
            "十月",
            "十一月",
            "十二月",
          ],
          day_full: [
            "星期日",
            "星期一",
            "星期二",
            "星期三",
            "星期四",
            "星期五",
            "星期六",
          ],
          day_short: [
            "太阳",
            "星期一",
            "星期二",
            "星期三",
            "星期四",
            "星期五",
            "星期六",
          ],
          label: {
            description: "描述",
          },
          buttons: {
            save: "节省",
            cancel: "取消",
            delete: "删除",
          },
        },
        hr: {
          month_full: [
            "Siječanj",
            "Veljača",
            "Ožujak",
            "Travanj",
            "Svibanj",
            "Lipanj",
            "Srpanj",
            "Kolovoz",
            "Rujan",
            "Listopad",
            "Studeni",
            "Prosinac",
          ],
          month_short: [
            "Sij",
            "Velj",
            "Ožu",
            "Tra",
            "Svi",
            "Lip",
            "Srp",
            "Kol",
            "Ruj",
            "Lis",
            "Stu",
            "Pro",
          ],
          day_full: [
            "Nedjelja",
            "Ponedjeljak",
            "Utorak",
            "Srijeda",
            "Četvrtak",
            "Petak",
            "Subota",
          ],
          day_short: ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"],
          label: {
            description: "Opis",
          },
          buttons: {
            save: "Uštedjeti",
            cancel: "Otkazati",
            delete: "Izbrisati",
          },
        },
        cs: {
          month_full: [
            "Leden",
            "Únor",
            "Březen",
            "Duben",
            "Květen",
            "Červen",
            "Červenec",
            "Srpen",
            "Září",
            "Říjen",
            "Listopad",
            "Prosinec",
          ],
          month_short: [
            "Led",
            "Ún",
            "Bře",
            "Dub",
            "Kvě",
            "Čer",
            "Čec",
            "Srp",
            "Září",
            "Říj",
            "List",
            "Pro",
          ],
          day_full: [
            "Neděle",
            "Pondělí",
            "Úterý",
            "Středa",
            "Čtvrtek",
            "Pátek",
            "Sobota",
          ],
          day_short: ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"],
          label: {
            description: "Popis",
          },
          buttons: {
            save: "Uložit",
            cancel: "zrušení",
            delete: "Vymazat",
          },
        },
        da: {
          month_full: [
            "Januar",
            "Februar",
            "Mars",
            "April",
            "Mai",
            "Juni",
            "Juli",
            "August",
            "September",
            "Oktober",
            "November",
            "Desember",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mai",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Des",
          ],
          day_full: [
            "Søndag",
            "Mandag",
            "Tirsdag",
            "Onsdag",
            "Torsdag",
            "Fredag",
            "Lørdag",
          ],
          day_short: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"],
          label: {
            description: "Beskrivelse",
          },
          buttons: {
            save: "Gemme",
            cancel: "Afbestille",
            delete: "Slet",
          },
        },
        nl: {
          month_full: [
            "Januari",
            "Februari",
            "Maart",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Augustus",
            "September",
            "Oktober",
            "November",
            "December",
          ],
          month_short: [
            "Jan",
            "Feb",
            "mrt",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Zondag",
            "Maandag",
            "Dinsdag",
            "Woensdag",
            "Donderdag",
            "Vrijdag",
            "Zaterdag",
          ],
          day_short: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"],
          label: {
            description: "Beschrijving",
          },
          buttons: {
            save: "Redden",
            cancel: "Annuleren",
            delete: "Verwijderen",
          },
        },
        fi: {
          month_full: [
            "Tammikuu",
            "Helmikuu",
            "Maaliskuu",
            "Huhtikuu",
            "Toukokuu",
            "Kes&auml;kuu",
            "Hein&auml;kuu",
            "Elokuu",
            "Syyskuu",
            "Lokakuu",
            "Marraskuu",
            "Joulukuu",
          ],
          month_short: [
            "Tam",
            "Hel",
            "Maa",
            "Huh",
            "Tou",
            "Kes",
            "Hei",
            "Elo",
            "Syy",
            "Lok",
            "Mar",
            "Jou",
          ],
          day_full: [
            "Sunnuntai",
            "Maanantai",
            "Tiistai",
            "Keskiviikko",
            "Torstai",
            "Perjantai",
            "Lauantai",
          ],
          day_short: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"],
          label: {
            description: "Kuvaus",
          },
          buttons: {
            save: "Tallentaa",
            cancel: "Peruuttaa",
            delete: "Poistaa",
          },
        },
        el: {
          month_full: [
            "Ιανουάριος",
            "Φεβρουάριος",
            "Μάρτιος",
            "Απρίλιος",
            "Μάϊος",
            "Ιούνιος",
            "Ιούλιος",
            "Αύγουστος",
            "Σεπτέμβριος",
            "Οκτώβριος",
            "Νοέμβριος",
            "Δεκέμβριος",
          ],
          month_short: [
            "ΙΑΝ",
            "ΦΕΒ",
            "ΜΑΡ",
            "ΑΠΡ",
            "ΜΑΙ",
            "ΙΟΥΝ",
            "ΙΟΥΛ",
            "ΑΥΓ",
            "ΣΕΠ",
            "ΟΚΤ",
            "ΝΟΕ",
            "ΔΕΚ",
          ],
          day_full: [
            "Κυριακή",
            "Δευτέρα",
            "Τρίτη",
            "Τετάρτη",
            "Πέμπτη",
            "Παρασκευή",
            "Κυριακή",
          ],
          day_short: ["ΚΥ", "ΔΕ", "ΤΡ", "ΤΕ", "ΠΕ", "ΠΑ", "ΣΑ"],
          label: {
            description: "Περιγραφή",
          },
          buttons: {
            save: "Αποθηκεύσετε",
            cancel: "Ματαίωση",
            delete: "Διαγράφω",
          },
        },
        hu: {
          month_full: [
            "Január",
            "Február",
            "Március",
            "Április",
            "Május",
            "Június",
            "Július",
            "Augusztus",
            "Szeptember",
            "Október",
            "November",
            "December",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Már",
            "Ápr",
            "Máj",
            "Jún",
            "Júl",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Vasárnap",
            "Hétfõ",
            "Kedd",
            "Szerda",
            "Csütörtök",
            "Péntek",
            "szombat",
          ],
          day_short: ["Va", "Hé", "Ke", "Sze", "Csü", "Pé", "Szo"],
          label: {
            description: "Leírás",
          },
          buttons: {
            save: "Megment",
            cancel: "Megszünteti",
            delete: "Töröl",
          },
        },
        id: {
          month_full: [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Mei",
            "Jun",
            "Jul",
            "Ags",
            "Sep",
            "Okt",
            "Nov",
            "Des",
          ],
          day_full: [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
          ],
          day_short: ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
          label: {
            description: "Keterangan",
          },
          buttons: {
            save: "Menyimpan",
            cancel: "Membatalkan",
            delete: "Menghapus",
          },
        },
        it: {
          month_full: [
            "Gennaio",
            "Febbraio",
            "Marzo",
            "Aprile",
            "Maggio",
            "Giugno",
            "Luglio",
            "Agosto",
            "Settembre",
            "Ottobre",
            "Novembre",
            "Dicembre",
          ],
          month_short: [
            "Gen",
            "Feb",
            "Mar",
            "Apr",
            "Mag",
            "Giu",
            "Lug",
            "Ago",
            "Set",
            "Ott",
            "Nov",
            "Dic",
          ],
          day_full: [
            "Domenica",
            "Lunedì",
            "Martedì",
            "Mercoledì",
            "Giovedì",
            "Venerdì",
            "Sabato",
          ],
          day_short: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
          label: {
            description: "Descrizione",
          },
          buttons: {
            save: "Salva",
            cancel: "Annulla",
            delete: "Eliminare",
          },
        },
        kr: {
          month_full: [
            "1월",
            "2월",
            "3월",
            "4월",
            "5월",
            "6월",
            "7월",
            "8월",
            "9월",
            "10월",
            "11월",
            "12월",
          ],
          month_short: [
            "1월",
            "2월",
            "3월",
            "4월",
            "5월",
            "6월",
            "7월",
            "8월",
            "9월",
            "10월",
            "11월",
            "12월",
          ],
          day_full: [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일",
          ],
          day_short: ["일", "월", "화", "수", "목", "금", "토"],
          label: {
            description: "설명",
          },
          buttons: {
            save: "구하다",
            cancel: "취소",
            delete: "삭제",
          },
        },
        fa: {
          month_full: [
            "ژانویه",
            "فوریه",
            "مارس",
            "آوریل",
            "مه",
            "ژوئن",
            "ژوئیه",
            "اوت",
            "سپتامبر",
            "اکتبر",
            "نوامبر",
            "دسامبر",
          ],
          month_short: [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
          ],
          day_full: [
            "يکشنبه",
            "دوشنبه",
            "سه‌شنبه",
            "چهارشنبه",
            "پنجشنبه",
            "جمعه",
            "شنبه",
          ],
          day_short: ["ی", "د", "س", "چ", "پ", "ج", "ش"],
          label: {
            description: "شرح",
          },
          buttons: {
            save: "صرفه جویی",
            cancel: "لغو کنید",
            delete: "حذف",
          },
        },
        pl: {
          month_full: [
            "Styczeń",
            "Luty",
            "Marzec",
            "Kwiecień",
            "Maj",
            "Czerwiec",
            "Lipiec",
            "Sierpień",
            "Wrzesień",
            "Październik",
            "Listopad",
            "Grudzień",
          ],
          month_short: [
            "Sty",
            "Lut",
            "Mar",
            "Kwi",
            "Maj",
            "Cze",
            "Lip",
            "Sie",
            "Wrz",
            "Paź",
            "Lis",
            "Gru",
          ],
          day_full: [
            "Niedziela",
            "Poniedziałek",
            "Wtorek",
            "Środa",
            "Czwartek",
            "Piątek",
            "Sobota",
          ],
          day_short: ["Nie", "Pon", "Wto", "Śro", "Czw", "Pią", "Sob"],
          label: {
            description: "Opis",
          },
          buttons: {
            save: "Ratować",
            cancel: "Anulować",
            delete: "Usuwać",
          },
        },
        pt: {
          month_full: [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ],
          month_short: [
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
          ],
          day_full: [
            "Domingo",
            "Segunda",
            "Terça",
            "Quarta",
            "Quinta",
            "Sexta",
            "Sábado",
          ],
          day_short: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
          label: {
            description: "Descrição",
          },
          buttons: {
            save: "Salvar",
            cancel: "Cancelar",
            delete: "Excluir",
          },
        },
        ro: {
          month_full: [
            "Ianuarie",
            "Februarie",
            "Martie",
            "Aprilie",
            "Mai",
            "Iunie",
            "Iulie",
            "August",
            "Septembrie",
            "Octombrie",
            "November",
            "December",
          ],
          month_short: [
            "Ian",
            "Feb",
            "Mar",
            "Apr",
            "Mai",
            "Iun",
            "Iul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Duminica",
            "Luni",
            "Marti",
            "Miercuri",
            "Joi",
            "Vineri",
            "Sambata",
          ],
          day_short: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sa"],
          label: {
            description: "Descriere",
          },
          buttons: {
            save: "Salvați",
            cancel: "Anulare",
            delete: "Șterge",
          },
        },
        ru: {
          month_full: [
            "Январь",
            "Февраль",
            "Март",
            "Апрель",
            "Maй",
            "Июнь",
            "Июль",
            "Август",
            "Сентябрь",
            "Oктябрь",
            "Ноябрь",
            "Декабрь",
          ],
          month_short: [
            "Янв",
            "Фев",
            "Maр",
            "Aпр",
            "Maй",
            "Июн",
            "Июл",
            "Aвг",
            "Сен",
            "Окт",
            "Ноя",
            "Дек",
          ],
          day_full: [
            "Воскресенье",
            "Понедельник",
            "Вторник",
            "Среда",
            "Четверг",
            "Пятница",
            "Суббота",
          ],
          day_short: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
          label: {
            description: "Описание",
          },
          buttons: {
            save: "Сохранять",
            cancel: "Отмена",
            delete: "Удалить",
          },
        },
        si: {
          month_full: [
            "Januar",
            "Februar",
            "Marec",
            "April",
            "Maj",
            "Junij",
            "Julij",
            "Avgust",
            "September",
            "Oktober",
            "November",
            "December",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Maj",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Nedelja",
            "Ponedeljek",
            "Torek",
            "Sreda",
            "Četrtek",
            "Petek",
            "Sobota",
          ],
          day_short: ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"],
          label: {
            description: "Opis",
          },
          buttons: {
            save: "Shrani",
            cancel: "Prekliči",
            delete: "Izbriši",
          },
        },
        es: {
          month_full: [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
          ],
          month_short: [
            "Ene",
            "Feb",
            "Mar",
            "Abr",
            "May",
            "Jun",
            "Jul",
            "Ago",
            "Sep",
            "Oct",
            "Nov",
            "Dic",
          ],
          day_full: [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
          ],
          day_short: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
          label: {
            description: "Descripción",
          },
          buttons: {
            save: "Ahorrar",
            cancel: "Cancelar",
            delete: "Borrar",
          },
        },
        sv: {
          month_full: [
            "Januari",
            "Februari",
            "Mars",
            "April",
            "Maj",
            "Juni",
            "Juli",
            "Augusti",
            "September",
            "Oktober",
            "November",
            "December",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "Maj",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Söndag",
            "Måndag",
            "Tisdag",
            "Onsdag",
            "Torsdag",
            "Fredag",
            "Lördag",
          ],
          day_short: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"],
          label: {
            description: "Beskrivning",
          },
          buttons: {
            save: "Spara",
            cancel: "Annullera",
            delete: "Radera",
          },
        },
        tr: {
          month_full: [
            "Ocak",
            "Şubat",
            "Mart",
            "Nisan",
            "Mayıs",
            "Haziran",
            "Temmuz",
            "Ağustos",
            "Eylül",
            "Ekim",
            "Kasım",
            "Aralık",
          ],
          month_short: [
            "Oca",
            "Şub",
            "Mar",
            "Nis",
            "May",
            "Haz",
            "Tem",
            "Ağu",
            "Eyl",
            "Eki",
            "Kas",
            "Ara",
          ],
          day_full: [
            "Pazar",
            "Pazartesi",
            "Salı",
            "Çarşamba",
            "Perşembe",
            "Cuma",
            "Cumartesi",
          ],
          day_short: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
          label: {
            description: "Tanım",
          },
          buttons: {
            save: "Kaydetmek",
            cancel: "İptal etmek",
            delete: "Silmek",
          },
        },
        ua: {
          month_full: [
            "Січень",
            "Лютий",
            "Березень",
            "Квітень",
            "Травень",
            "Червень",
            "Липень",
            "Серпень",
            "Вересень",
            "Жовтень",
            "Листопад",
            "Грудень",
          ],
          month_short: [
            "Січ",
            "Лют",
            "Бер",
            "Кві",
            "Тра",
            "Чер",
            "Лип",
            "Сер",
            "Вер",
            "Жов",
            "Лис",
            "Гру",
          ],
          day_full: [
            "Неділя",
            "Понеділок",
            "Вівторок",
            "Середа",
            "Четвер",
            "П'ятниця",
            "Субота",
          ],
          day_short: ["Нед", "Пон", "Вів", "Сер", "Чет", "Птн", "Суб"],
          label: {
            description: "опис",
          },
          buttons: {
            save: "зберегти",
            cancel: "Скасувати",
            delete: "Видалити",
          },
        },
        he: {
          month_full: [
            "ינואר",
            "פברואר",
            "מרץ",
            "אפריל",
            "מאי",
            "יוני",
            "יולי",
            "אוגוסט",
            "ספטמבר",
            "אוקטובר",
            "נובמבר",
            "דצמבר",
          ],
          month_short: [
            "ינואר",
            "פברואר",
            "מרץ",
            "אפריל",
            "מאי",
            "יוני",
            "יולי",
            "אוגוסט",
            "ספטמבר",
            "אוקטובר",
            "נובמבר",
            "דצמבר",
          ],
          day_full: [
            "יוֹם רִאשׁוֹן",
            "יוֹם שֵׁנִי",
            "יוֹם שְׁלִישִׁי",
            "יום רביעי",
            "יוֹם חֲמִישִׁי",
            "יוֹם שִׁישִׁי",
            "יום שבת",
          ],
          day_short: [
            "שמש",
            "יום שני",
            "ג'",
            "היינו עושים",
            "יום ה'",
            "שישי",
            "ישב",
          ],
          label: {
            description: "תיאור",
          },
          buttons: {
            save: "להציל",
            cancel: "לְבַטֵל",
            delete: "לִמְחוֹק",
          },
        },
        no: {
          month_full: [
            "januar",
            "februar",
            "mars",
            "april",
            "Kan",
            "juni",
            "juli",
            "august",
            "september",
            "oktober",
            "november",
            "desember",
          ],
          month_short: [
            "Jan",
            "feb",
            "Mar",
            "apr",
            "Kan",
            "jun",
            "jul",
            "august",
            "sep",
            "okt",
            "nov",
            "des",
          ],
          day_full: [
            "søndag",
            "Monday",
            "tirsdag",
            "onsdag",
            "Torsdag",
            "fredag",
            "lørdag",
          ],
          day_short: ["Søn", "man", "tirs", "ons", "tor", "fre", "Lør"],
          label: {
            description: "Beskrivelse",
          },
          buttons: {
            save: "Lagre",
            cancel: "Avbryt",
            delete: "Slett",
          },
        },
        sk: {
          month_full: [
            "Január",
            "február",
            "marec",
            "apríl",
            "máj",
            "jún",
            "júl",
            "august",
            "september",
            "október",
            "november",
            "december",
          ],
          month_short: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "máj",
            "Jun",
            "júl",
            "Aug",
            "Sep",
            "október",
            "Nov",
            "Dec",
          ],
          day_full: [
            "Nedeľa",
            "pondelok",
            "utorok",
            "streda",
            "štvrtok",
            "piatok",
            "sobota",
          ],
          day_short: ["Ne", "Po", "Ut", "St", "Št", "Pia", "So"],
          label: {
            description: "Popis",
          },
          buttons: {
            save: "Uložiť",
            cancel: "Zrušiť",
            delete: "Odstrániť",
          },
        },
      },
      localLang: opt.localLang || "en",
      currentLanguage: {},
    };
  }

  // initialize templates
  initTemplates(templ = {}) {
    this.templates = {
      tooltip_text:
        templ.tooltip_text ||
        ((start, end, task) =>
          `<b>Task:</b> ${task.text}<br/><b>Start date:</b> ${start}<br/><b>End date:</b> ${end}`),
      taskbar_text: templ.taskbar_text || ((start, end, task) => task.text),
      task_drag: templ.task_drag || true,
      grid_folder: templ.grid_folder || "",
      grid_file: templ.grid_file || "",
      grid_blank: templ.grid_blank || "",
      showLightBox: templ.showLightBox || undefined,
      grid_header_class: templ.grid_header_class || undefined,
      grid_row_class: templ.grid_row_class || undefined,
      task_class: templ.task_class || undefined,
      task_row_class: templ.task_row_class || undefined,
      scale_cell_class: templ.scale_cell_class || undefined,
      grid_cell_class: templ.grid_cell_class || undefined,
      timeline_cell_class: templ.timeline_cell_class || undefined,
    };
  }

  /**
   * Get an array of dates between the range of startDate and endDate.
   * @param {Date} startDate - The start date of the range.
   * @param {Date} endDate - The end date of the range.
   * @param {boolean} [filterWeekends=true] - Whether to filter out weekends from the date range.
   * @returns {Array<number>} - An array of dates (timestamps) between the start and end dates.
   */
  getDates(startDate, endDate, filterWeekends = true) {
    // Convert to timestamps and normalize to start of the day
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);

    const weekday = this.#dateFormat.day_short;

    // Array to hold the dates
    const dates = [];

    // Loop through each date from start to end
    for (let currentDate = start; currentDate <= end; currentDate += 86400000) {
      const dayName = weekday[new Date(currentDate).getDay()];
      // if fullWeek is false then don't push weekends date in dates array
      if (
        filterWeekends &&
        !this.options.fullWeek &&
        this.options.weekends.includes(dayName)
      ) {
        continue;
      }
      dates.push(currentDate);
    }

    return dates;
  }

  init() {
    this.options.currentLanguage = this.options.i18n[this.options.localLang];

    /*for Safari below v16 */
    document.removeEventListener(
      "webkitfullscreenchange",
      this.handleFullScreenChangeSafari
    );
    document.addEventListener(
      "webkitfullscreenchange",
      this.handleFullScreenChangeSafari
    );

    // Listen for the fullscreenchange event
    document.removeEventListener(
      "fullscreenchange",
      this.handleFullScreenChange
    );
    document.addEventListener("fullscreenchange", this.handleFullScreenChange);

    window.removeEventListener("resize", this.handleResizeWindow);
    window.addEventListener("resize", this.handleResizeWindow);

    this.createTooltip();

    if (this.templates?.showLightBox !== false) {
      this.createLightbox();
    }
  }

  handleResizeWindow(event) {
    if (
      this.calculateTimeLineWidth("updated") !==
      this.calculateTimeLineWidth("current")
    ) {
      this.updateBody();
    }

    // handle custom event
    this.dispatchEvent("onResize", { event });
  }

  handleFullScreenChangeSafari() {
    // Check if full screen mode has been exited
    if (!document.webkitIsFullScreen) {
      this.element.classList.remove("js-gantt-fullScreen");
      this.exitFullScreen(true);
    }
  }

  handleFullScreenChange() {
    // Check if full screen mode has been exited
    if (!document.fullscreenElement) {
      this.element.classList.remove("js-gantt-fullScreen");
      this.exitFullScreen(true);
    }
  }

  /**
   * Method to render the gantt chart.
   * @param {HTMLElement} element - gantt html element (optional).
   */
  render(ele = this.element) {
    if (
      this.options.weekStart > 6 ||
      typeof this.options.weekStart !== "number"
    ) {
      const message =
        this.options.weekStart > 6
          ? "enter week start between 0 to 6"
          : "type of week start should be number!";
      this.toastr("Error", message, "error");
    }
    if (!this.options.date_format) {
      this.toastr(
        "Error",
        `date_format is ${this.options.date_format}, please provide a valid date format of your data date format`,
        "error"
      );
    }

    // Initialize LinkManager with links data
    if (this.#linkManager && this.options.links?.length) {
      this.#linkManager.init(this.options.links);
    }

    // Initialize I18nManager with current locale
    if (this.#i18nManager) {
      this.#i18nManager.setLocale(this.options.localLang || "en");
    }

    this.element = ele;
    const { options } = this;
    this.options.currentLanguage = this.options.i18n[this.options.localLang];
    this.zoomInit("initial");

    // create a copy of the data - using imported deepClone utility
    if (this.#arrangeData) {
      this.originalData = deepClone(this.options.data);
    }

    // Initialize TaskManager with data
    if (this.#taskManager && this.originalData?.length) {
      this.#taskManager.init(this.originalData);
      // Sync opened tasks with TaskManager
      this.options.openedTasks.forEach((id) => this.#taskManager.expand(id));
    }

    // Initialize ScaleManager with current scale options
    if (this.#scaleManager) {
      this.#scaleManager.scales = this.options.scales;
      this.#scaleManager.zoomLevel = this.options.zoomLevel;
      this.#scaleManager.weekStart = this.options.weekStart;
    }

    const { originalData } = this;
    const { date_format } = options;

    // process task start and end date - using imported stripTime utility
    const processDate = (date) => {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate) && date_format) {
        return this.getDateTimeComponents(date);
      } else if (!isNaN(parsedDate) && !parsedDate.getHours()) {
        return stripTime(parsedDate);
      }
      return date;
    };

    function createNestedTree(flatArray, parentIdKey = "parent", idKey = "id") {
      const tree = [];

      const map = {};
      flatArray.forEach((item, i) => {
        if (originalData[i].start_date !== undefined) {
          originalData[i].start_date = processDate(originalData[i].start_date);
        }

        if (originalData[i].end_date !== undefined) {
          originalData[i].end_date = processDate(originalData[i].end_date);
        }

        const id = item[idKey];
        const parentId = item[parentIdKey];

        map[id] = { ...item, children: map[id] ? map[id].children : [] };

        if (!parentId) {
          tree.push(map[id]);
        } else {
          map[parentId] = map[parentId] || { children: [] };
          map[parentId].children.push(map[id]);
        }
      });

      return tree;
    }

    this.options.data = createNestedTree(this.originalData);

    // calculate and add duration and start and end date in all data objects
    this.updateTaskDuration();

    this.#arrangeData = false;

    if (!this.options.startDate || !this.options.endDate) {
      const { startDate, endDate } = this.getStartAndEndDate();
      this.options.startDate = this.options.startDate || startDate;
      this.options.endDate = this.options.endDate || endDate;
    }

    // Using imported stripTime utility
    const startDateTimestamp = stripTime(options.startDate).getTime();
    const endDateTimestamp = stripTime(options.endDate).getTime();
    if (
      !this.dates ||
      startDateTimestamp != this.dates[0] ||
      endDateTimestamp != this.dates[this.dates.length - 1]
    ) {
      this.dates = this.getDates(options.startDate, options.endDate);
    }

    // set all task expanded initially if collapse is false
    if (!options.collapse && !options?.openedTasks?.length) {
      this.options.openedTasks = this.originalData.map((task) => task?.id);
    }

    // Using imported addClass utility
    if (this.fullScreen === true) {
      addClass(this.element, "js-gantt-fullScreen");
    }

    // Using imported createElement utility
    const jsGanttLayout = createElement("div", {
      id: "js-gantt-layout",
      classes: ["js-gantt-layout", "js-gantt-d-flex"],
    });

    this.createSidebar(jsGanttLayout);

    // Using imported createElement utility
    const timeline = createElement("div", {
      id: "js-gantt-timeline-cell",
      classes: ["js-gantt-timeline-cell"],
    });

    this.createTimelineScale(timeline);
    this.createTimelineBody(timeline, jsGanttLayout, true);

    if (options?.rightGrid) {
      const newGridOptions = { ...options };
      newGridOptions.columns = options.rightGrid;
      this.createRightSidebar(newGridOptions, jsGanttLayout);
    }

    // Using imported querySelector utility
    const verScroll = querySelector(".js-gantt-ver-scroll", this.element)?.scrollTop || 0;
    const horScroll = querySelector(".js-gantt-hor-scroll", this.element)?.scrollLeft || 0;

    // append js-gantt-layout in element
    const layout = querySelector("#js-gantt-layout", this.element);
    if (layout) {
      layout.replaceWith(jsGanttLayout);
    } else {
      this.element.append(jsGanttLayout);
    }

    this.createScrollbar(jsGanttLayout, verScroll || 0, horScroll || 0);

    const timelineDataContainer = querySelector(
      "#js-gantt-timeline-data",
      this.element
    );

    if (!this.markerArea) {
      // Using imported createElement utility
      const markerArea = createElement("div", {
        classes: ["js-gantt-marker-area"],
      });
      this.markerArea = markerArea;

      // add all markers
      for (const marker of this.options.customMarker) {
        if (this.outOfGanttRange(marker?.start_date)) {
          continue;
        }
        this.addMarkerToGantt(marker);
      }

      if (options.todayMarker) {
        this.addTodayFlag();
      }
    }
    timelineDataContainer.append(this.markerArea);

    // add today marker - using imported createElement
    const linksArea = createElement("div", {
      id: "js-gantt-links-area",
      classes: ["js-gantt-links-area"],
    });
    timelineDataContainer.append(linksArea);

    // create links
    for (let i = 0; i < this.options.links.length; i++) {
      this.createLinks(
        this.options.links[i].source,
        this.options.links[i].target,
        this.options.links[i]
      );
    }
  }

  // create left sidebar
  createSidebar(jsGanttLayout) {
    const { options } = this;

    // sidebar head cells - using imported createElement
    const sidebar = createElement("div", {
      id: "js-gantt-grid-left-data",
      classes: ["js-gantt-left-cell"],
    });

    const headCellContainer = createElement("div", {
      classes: ["sidebar-head-cell-container"],
    });

    const containerHeight = this.calculateScaleHeight("header");

    const totalWidth = options.columns.reduce(
      (totalWidth, col) => totalWidth + col.width,
      0
    );

    setStyles(sidebar, {
      width: `${totalWidth}px`,
      minWidth: `${totalWidth}px`,
    });

    setStyles(headCellContainer, {
      height: containerHeight,
      lineHeight: containerHeight,
    });

    sidebar.append(headCellContainer);

    let resizerLeft = 0;

    // head loop of left side
    for (let i = 0; i < options.columns.length; i++) {
      const column = options.columns[i];
      const headCell = createElement("div", {
        classes: ["head-cell"],
        attributes: { "data-column-index": i },
        styles: { width: `${column.width || 80}px` },
        html: column.label,
      });

      //add custom class from user
      this.addClassesFromFunction(
        this.templates.grid_header_class,
        headCell,
        column,
        i
      );

      headCellContainer.append(headCell);

      if (this.options.sort) {
        headCell.addEventListener("click", () => {
          let isAsc = !this.options?.sortOption?.isAsc;
          const sortBy = column?.name;

          if (sortBy !== this.options?.sortOption?.sortBy) {
            isAsc = true; // Set isAsc to true by default if sortBy is different
          }
          this.options.sortOption = { sortBy, isAsc };
          this.sort(sortBy, isAsc);
        });

        // add sort icon to the current sorting column
        if (
          this.options?.sortOption &&
          this.options?.sortOption?.sortBy == column?.name
        ) {
          const isAsc = !this.options?.sortOption?.isAsc;
          // Using imported createElement utility
          const sortIcon = createElement("div", {
            classes: ["js-gantt-sort", isAsc ? "js-gantt-asc" : "js-gantt-desc"],
          });
          headCell.appendChild(sortIcon);
        }
      }

      if (i < options.columns.length) {
        // Using imported createElement utility
        const resizerWrap = createElement("div", {
          id: `js-gantt-col-resizer-wrap-${i}`,
          classes: ["js-gantt-col-resizer-wrap"],
          styles: { height: this.calculateScaleHeight("header") },
        });

        if (column.resize === true) {
          // Using imported createElement utility
          const resizer = createElement("div", {
            classes: ["js-gantt-col-resizer"],
          });
          resizerWrap.append(resizer);
          resizerLeft += column.width || 80;
          setStyles(resizerWrap, { left: `${resizerLeft}px` });
          headCellContainer.append(resizerWrap);
          this.resizeColumns(
            resizerWrap,
            `data-column-index="${i}"`,
            headCell,
            headCellContainer,
            column.min_width,
            column.max_width,
            i,
            sidebar,
            false
          );
        }
      }
    }

    // data loop of left side - using imported createElement
    const leftDataContainer = createElement("div", {
      id: "js-gantt-left-grid",
      classes: ["js-gantt-grid-data"],
    });

    // loop through all the data
    for (let j = 0; j < options.data.length; j++) {
      const task = this.options.data[j];
      if (!this.isTaskNotInSearchedData(task.id)) {
        if (this.#searchedData) {
          this.addTaskToOpenedList(task.id);
        }

        // Using imported createElement utility
        const dataItem = createElement("div", {
          classes: [
            "js-gantt-row-item",
            "js-gantt-d-flex",
            this.options.selectedRow === `${task.id}`
              ? "js-gantt-selected"
              : "js-gantt-row-item",
          ],
          attributes: {
            "js-gantt-data-task-id": j,
            "js-gantt-task-id": task.id,
          },
          styles: {
            height: `${options.row_height}px`,
            lineHeight: `${options.row_height}px`,
          },
        });

        const { start_date, end_date } = this.getLargeAndSmallDate(task);

        //add custom classes from user
        this.addClassesFromFunction(
          this.templates.grid_row_class,
          dataItem,
          start_date,
          end_date,
          task
        );


        const that = this;

        // handle double click event
        dataItem.addEventListener("dblclick", handleDblClick);

        function handleDblClick(e) {
          if (e.target.classList.contains("js-gantt-tree-icon")) {
            return;
          }
          // custom event handler
          that.dispatchEvent("onBeforeTaskDblClick", {
            task,
          });

          // if onBeforeTaskDblClick return false then do not drag the task
          if (that.eventValue === false) {
            that.eventValue = true;
            return;
          }

          that.dispatchEvent("onTaskDblClick", {
            task,
          });

          that.showLightBox(task);
        }

        // Handle mouseover event
        dataItem.addEventListener("mouseover", () => {
          this.updateTooltipBody(task);
        });

        // Handle mouseleave event
        dataItem.addEventListener("mouseleave", this.hideTooltip.bind(this));

        this.addClickListener(dataItem, (e) => {
          if (e.target.classList.contains("js-gantt-tree-icon")) {
            return;
          }

          // select task
          that.selectTask(task);
        });

        // loop through all the columns
        for (let k = 0; k < this.options.columns.length; k++) {
          const column = this.options.columns[k];

          // Using imported createElement utility
          const cell = createElement("div", {
            classes: ["js-gantt-cell"],
            attributes: { "data-column-index": k },
            styles: {
              width: `${column.width || 80}px`,
              ...(column.align && { textAlign: column.align, justifyContent: column.align }),
            },
          });

          //add custom class from user
          this.addClassesFromFunction(
            this.templates.grid_cell_class,
            cell,
            column,
            task
          );

          // Using imported createElement utility
          const content = createElement("div", {
            classes: [
              "js-gantt-cell-data",
              k == 0 ? "js-gantt-d-block" : "js-gantt-data",
            ],
          });

          // Using imported createElement utility
          const jsGanttBlank = createElement("div", {
            classes: ["js-gantt-blank"],
            html: this.callTemplate("grid_blank", task),
          });

          // function to get content HTML
          const getContentHTML = () => {
            return column.template(task) || task[column.name] || " ";
          };

          // content of the column
          content.innerHTML = getContentHTML();

          this.attachEvent("onAfterTaskUpdate", () => {
            content.innerHTML = getContentHTML();
          });

          // update content innerHTML on after progress drag
          this.attachEvent("onAfterProgressDrag", () => {
            content.innerHTML = getContentHTML();
          });

          this.attachEvent("onTaskDrag", () => {
            content.innerHTML = getContentHTML();
          });

          this.attachEvent("onAfterTaskDrag", () => {
            content.innerHTML = getContentHTML();
          });

          if (column.tree) {
            addClass(cell, "js-gantt-d-flex");

            // folder icon - using imported createElement
            const folderIcon = createElement("div", {
              classes: ["js-gantt-folder-icon"],
              html: this.callTemplate("grid_folder", task),
            });

            if (
              task.children &&
              task?.children?.length &&
              !this.options.splitTask
            ) {
              // tree icon - using imported createElement
              const treeIcon = createElement("div", {
                id: `toggle-tree-${j}`,
                classes: [
                  "js-gantt-tree-icon",
                  !this.isTaskOpened(task.id)
                    ? "js-gantt-tree-close"
                    : "js-gantt-tree-open",
                ],
              });
              cell.append(treeIcon);

              // toggle children
              this.addClickListener(treeIcon, () => {
                const isTaskCollapse = !this.isTaskOpened(task.id);

                if (isTaskCollapse) {
                  this.addTaskToOpenedList(task.id);
                } else {
                  this.removeTaskFromOpenedList(task.id);
                }

                this.setCollapseAll(
                  task.children,
                  task.id,
                  isTaskCollapse ? "open" : "collapse"
                );

                this.createTaskBars();

                // Using imported class utilities
                if (hasClass(treeIcon, "js-gantt-tree-close")) {
                  removeClass(treeIcon, "js-gantt-tree-close");
                  addClass(treeIcon, "js-gantt-tree-open");
                } else {
                  removeClass(treeIcon, "js-gantt-tree-open");
                  addClass(treeIcon, "js-gantt-tree-close");
                }

                this.createScrollbar(jsGanttLayout);

                // custom event of toggle tree
                this.dispatchEvent("onTaskToggle", {
                  task,
                  isTaskOpened: isTaskCollapse,
                });
              });
            } else if (!this.options.splitTask) {
              cell.append(jsGanttBlank);
            }
            cell.append(folderIcon);
          }
          cell.append(content);
          dataItem.append(cell);

          if (column?.editor) {
            cell.addEventListener("click", (e) => {
              if (e.target.classList.contains("js-gantt-tree-icon")) {
                return;
              }
              this.addInlineEditor(
                task,
                column.editor,
                cell,
                leftDataContainer
              );
            });
          }
        }

        leftDataContainer.append(dataItem);
      }

      if (!this.options.splitTask && task?.children?.length) {
        this.createSidebarChild(
          task.children,
          options,
          leftDataContainer,
          1,
          j,
          false,
          this.isTaskOpened(task.id)
        );
      }
    }

    sidebar.append(leftDataContainer);
    jsGanttLayout.append(sidebar);

    // Using imported createElement utility
    const sidebarResizerWrap = createElement("div", {
      id: "js-gantt-left-layout-resizer-wrap",
      classes: ["js-gantt-left-layout-resizer-wrap"],
      styles: { left: `${totalWidth}px` },
    });

    const sidebarResizer = createElement("div", {
      classes: ["js-gantt-left-layout-resizer"],
    });

    sidebarResizerWrap.append(sidebarResizer);
    jsGanttLayout.append(sidebarResizerWrap);
    this.resizeSidebar(sidebarResizerWrap, sidebarResizer, sidebar);
  }

  // create header of scale
  createTimelineScale(timeline) {
    const { options } = this;
    const { dates } = this;
    const scaleManager = this.#scaleManager;

    this.#ganttHeight = this.calculateGanttHeight;
    this.attachEvent("onTaskToggle", () => {
      const tempHeight = this.calculateGanttHeight;
      const isVerScrollExist = this.#ganttHeight > this.element.offsetHeight;

      if (
        (!isVerScrollExist && tempHeight > this.element.offsetHeight) ||
        (isVerScrollExist && tempHeight < this.element.offsetHeight)
      ) {
        this.#ganttHeight = tempHeight;
        this.updateBody();
      }
    });

    // Using imported createElement utility
    const timelineScale = createElement("div", {
      classes: ["js-gantt-scale"],
      styles: { height: this.calculateScaleHeight("header") },
    });

    for (let i = 0; i < options.scales.length; i++) {
      const scale = options.scales[i];
      const timelineScaleHeight = this.calculateScaleHeight("body", i);

      // Using imported createElement utility
      const timelineScaleRow = createElement("div", {
        classes: ["js-gantt-scale-row"],
        styles: {
          height: timelineScaleHeight,
          lineHeight: timelineScaleHeight,
        },
      });

      let rangeCount = 0;
      let endDate = new Date(0).getTime();

      for (let j = 0; j < dates.length; j++) {
        const date = dates[j];
        if (
          new Date(endDate).getTime() >= new Date(date).setHours(0, 0, 0, 0)
        ) {
          continue;
        }

        // Use ScaleManager for date formatting when format is not a function
        const dateFormat = isFunction(scale.format)
          ? scale.format(new Date(date))
          : scaleManager
            ? scaleManager.formatDate(new Date(date), scale.format, this.#dateFormat)
            : this.formatDateToString(scale.format, date);

        let colDates;

        // Helper function to check if scale is multi-unit
        const isMultiUnitScale = (scale) => {
          return (
            (scale.unit === "day" && scale.step > 1) ||
            ["week", "month", "quarter", "year"].includes(scale.unit)
          );
        };

        // if date scale unit is week || month || year || (day && step > 1)
        if (isMultiUnitScale(scale)) {
          colDates = this.initColSizes(scale.unit, scale.step, date);
        }

        // Build cell classes - use ScaleManager for today/weekend detection
        const cellClasses = ["js-gantt-scale-cell"];
        if (scaleManager && scale.unit === "day") {
          if (scaleManager.isToday(new Date(date))) {
            cellClasses.push("js-gantt-scale-cell-today");
          }
          if (scaleManager.isWeekend(new Date(date), options.weekends)) {
            cellClasses.push("js-gantt-scale-cell-weekend");
          }
        }

        // Using imported createElement utility
        const dateCell = createElement("div", {
          classes: cellClasses,
          html: `<span class="date-scale">${dateFormat}</span>`,
          styles: isMultiUnitScale(scale)
            ? {
              width: `${colDates.dateCount * this.calculateGridWidth(date)}px`,
              left: `${rangeCount}px`,
            }
            : {
              left: `${j * this.calculateGridWidth(date, "day")}px`,
              width: `${this.calculateGridWidth(date, "day")}px`,
            },
        });

        //add custom class from user
        this.addClassesFromFunction(
          this.templates.scale_cell_class,
          dateCell,
          date,
          scale,
          i
        );

        const currentDate = new Date(date).setHours(0, 0, 0, 0);
        if (
          isMultiUnitScale(scale) &&
          new Date(endDate).getTime() < currentDate
        ) {
          timelineScaleRow.append(dateCell);
          rangeCount += colDates.dateCount * this.calculateGridWidth(date);
          endDate = new Date(colDates.endDate);
        } else if (scale.unit == "hour") {
          const dateStartHour = new Date(date).getHours();
          const cellDate = new Date(date);
          const cellWidth = this.calculateGridWidth(date);

          const fragment = document.createDocumentFragment();
          for (let k = dateStartHour; k < 24; k++) {
            const hourCell = dateCell.cloneNode(true);

            // Use ScaleManager for hour formatting
            const hourFormat = isFunction(scale.format)
              ? scale.format(cellDate)
              : scaleManager
                ? scaleManager.formatDate(cellDate, scale.format, this.#dateFormat)
                : this.formatDateToString(scale.format, cellDate);

            hourCell.innerHTML = hourFormat;
            cellDate.setHours(k + 1);
            setStyles(hourCell, {
              width: `${cellWidth}px`,
              left: `${rangeCount}px`,
            });
            fragment.appendChild(hourCell);
            rangeCount += cellWidth;
          }
          timelineScaleRow.append(fragment);
        } else if (scale.unit == "day" && scale.step == 1) {
          timelineScaleRow.append(dateCell);
        }
      }
      timelineScale.append(timelineScaleRow);
    }
    setStyles(timelineScale, {
      width: `${this.calculateTimeLineWidth("updated", "day")}px`,
    });
    timeline.append(timelineScale);
  }

  // create grid body
  createTimelineBody(timeline, jsGanttLayout, isFromRender = false) {
    const { options } = this;

    // Using imported createElement utility
    const timelineDataContainer = createElement("div", {
      id: "js-gantt-timeline-data",
      classes: ["js-gantt-timeline-data"],
    });

    if (this.options.dropArea) {
      // Using imported createElement utility
      const dropArea = createElement("div", {
        classes: ["drop-area"],
      });
      timelineDataContainer.appendChild(dropArea);
    }

    // Using imported createElement utility
    const jsGanttTaskData = createElement("div", {
      classes: ["js-gantt-task-data"],
    });

    const timelineRowTemplate = this.createRowTemplate();
    // grid data loop
    for (let j = 0; j < options.data.length; j++) {
      const task = this.options.data[j];
      if (!this.isTaskNotInSearchedData(task.id)) {
        const timelineRow = timelineRowTemplate.cloneNode(true);
        const isSelected = options.selectedRow === `${task.id}`;

        if (isSelected) {
          addClass(timelineRow, "js-gantt-selected");
        }

        timelineRow.setAttribute("js-gantt-data-task-id", j);
        timelineRow.setAttribute("js-gantt-task-id", task.id);

        //add custom classes from user
        const { start_date, end_date } = this.getLargeAndSmallDate(task);

        this.addClassesFromFunction(
          this.templates.task_row_class,
          timelineRow,
          start_date,
          end_date,
          task
        );

        // handle cell click event
        this.addClickListener(timelineRow, (e) => {
          if (hasClass(e.target, "js-gantt-task-cell")) {
            this.dispatchEvent("onCellClick", {
              task,
              cellDate: e.target.getAttribute("js-gantt-cell-date"),
            });
          }
        });

        jsGanttTaskData.append(timelineRow);
      }

      // if children exist
      if (task?.children?.length && !this.options.splitTask) {
        this.createTimelineChildBody(
          task.children,
          jsGanttTaskData,
          j,
          this.options.openedTasks.includes(task.id),
          timelineRowTemplate
        );
      }
    }

    setStyles(timelineDataContainer, {
      width: `${this.calculateTimeLineWidth("updated", "day")}px`,
    });

    timelineDataContainer.append(jsGanttTaskData);
    timeline.append(timelineDataContainer);

    // Using imported querySelector utility
    const isCalendarExist = querySelector("#js-gantt-timeline-cell", this.element);

    if (isCalendarExist && isFromRender === false) {
      isCalendarExist.replaceWith(timeline);
    } else {
      jsGanttLayout.append(timeline);
    }

    this.createTaskBars(timelineDataContainer, isFromRender);

    // create custom scroller
    if (!isFromRender) {
      this.createScrollbar(
        jsGanttLayout,
        this.verScroll || 0,
        this.horScroll || 0
      );

      if (!this.markerArea) {
        // Using imported createElement utility
        const markerArea = createElement("div", {
          classes: ["js-gantt-marker-area"],
        });
        this.markerArea = markerArea;

        // add all markers
        for (const marker of this.options.customMarker) {
          if (this.outOfGanttRange(marker?.start_date)) {
            continue;
          }
          this.addMarkerToGantt(marker);
        }

        // add today marker
        if (options.todayMarker) {
          this.addTodayFlag();
        }
      }
      timelineDataContainer.append(this.markerArea);
    }

    if (this.options.selectAreaOnDrag === true) {
      this.selectAreaOnDrag(timelineDataContainer);
    }
  }

  /**
   * Method to create a timeline row template
   * @returns { HTMLElement } timelineRow
   */
  createRowTemplate() {
    const { options, dates } = this;
    const weekday = this.#dateFormat.day_short;
    const scaleManager = this.#scaleManager;

    // Using imported createElement utility
    const timelineRow = createElement("div", {
      classes: ["js-gantt-task-row"],
      styles: { height: `${options.row_height}px` },
    });

    let cellEndDate = new Date(0);
    let rangeCount = 0;

    const dateFormat =
      this.options.zoomLevel === "day"
        ? "%Y-%m-%d"
        : this.options.zoomLevel === "week"
          ? "W-%W"
          : this.options.zoomLevel === "month"
            ? "M-%m"
            : this.options.zoomLevel === "quarter"
              ? "Q-%q"
              : "%Y";

    for (let k = 0; k < dates.length; k++) {
      const date = new Date(dates[k]);

      if (new Date(cellEndDate).getTime() >= date.setHours(0, 0, 0, 0)) {
        continue;
      }

      let colDates;
      const gridWidth = this.calculateGridWidth(date);

      // Build cell classes dynamically
      const cellClasses = ["js-gantt-task-cell"];

      if (this.options.zoomLevel !== "day") {
        colDates = this.initColSizes(this.options.zoomLevel, 1, date);
      } else {
        // Use ScaleManager for weekend detection if available
        const isWeekend = scaleManager
          ? scaleManager.isWeekend(date, options.weekends.map(w => weekday.indexOf(w)))
          : options.weekends.includes(weekday[date.getDay()]);

        cellClasses.push(
          isWeekend ? "js-gantt-weekend-cell" : "js-gantt-weekday-cell"
        );

        if (k === 0) {
          cellClasses.push("js-gantt-border-left-none");
        }

        // Use ScaleManager to detect today
        if (scaleManager && scaleManager.isToday(date)) {
          cellClasses.push("js-gantt-today-cell");
        }
      }

      // Calculate styles based on zoom level
      const cellStyles =
        this.options.zoomLevel !== "day"
          ? {
            left: `${rangeCount}px`,
            width:
              this.options.zoomLevel === "hour"
                ? `${gridWidth}px`
                : `${colDates.dateCount * gridWidth}px`,
          }
          : {
            left: `${gridWidth * k}px`,
            width: `${gridWidth}px`,
          };

      // Format date for cell attribute - use ScaleManager if available
      const cellDateAttr = scaleManager
        ? scaleManager.formatDate(date, dateFormat, this.#dateFormat)
        : this.formatDateToString(dateFormat, date);

      // Using imported createElement utility
      const timelineCell = createElement("div", {
        classes: cellClasses,
        styles: cellStyles,
        attributes: { "js-gantt-cell-date": cellDateAttr },
      });

      //add custom classes from user
      this.addClassesFromFunction(
        this.templates.timeline_cell_class,
        timelineCell,
        dates[k]
      );

      const currentDate = new Date(date).setHours(0);

      if (this.options.zoomLevel === "hour") {
        const cellWidth = gridWidth;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 24; i++) {
          const hourCell = timelineCell.cloneNode(true);
          setStyles(hourCell, {
            left: `${rangeCount}px`,
            width: `${cellWidth}px`,
          });
          rangeCount += cellWidth;
          fragment.appendChild(hourCell);
        }
        timelineRow.append(fragment);
      } else if (
        this.options.zoomLevel !== "day" &&
        new Date(cellEndDate).getTime() < currentDate
      ) {
        rangeCount += colDates.dateCount * gridWidth;
        cellEndDate = new Date(colDates.endDate);
        timelineRow.append(timelineCell);
      } else if (this.options.zoomLevel === "day") {
        timelineRow.append(timelineCell);
      }
    }

    return timelineRow;
  }

  /**
   * Method to create taskbars
   */
  createTaskBars(barContainer = null, isFromRender = false) {
    // if splitTask is true then run this.createSplitTask
    if (this.options.splitTask) {
      this.createSplitTask(barContainer, isFromRender);
      return;
    }

    let rowCount = 0;

    // Using imported createElement utility
    const jsGanttBarsArea = createElement("div", {
      id: "js-gantt-bars-area",
      classes: ["js-gantt-bars-area"],
    });

    for (let j = 0; j < this.options.data.length; j++) {
      const task = this.options.data[j];
      const cellStartDate = this.options.startDate;

      if (!this.isTaskNotInSearchedData(task.id)) {
        let start_date = new Date(task.start_date);
        let end_date = new Date(task.end_date);

        if (task.children?.length) {
          ({ start_date, end_date } = this.getLargeAndSmallDate(task));
        }

        let isCellGreater = true;
        let cellBefore = this.getDates(
          cellStartDate,
          task.type === "milestone" ? task.start_date : start_date
        );

        if (cellBefore.length === 0) {
          cellBefore = this.getDates(start_date, cellStartDate);
          isCellGreater = false;
        }

        if (isCellGreater) {
          cellBefore = cellBefore.length - 1;
        } else {
          cellBefore = -(cellBefore.length - 1);
        }

        // Build task bar classes
        const taskBarClasses = ["js-gantt-bar-task"];
        if (task.type === "milestone") {
          taskBarClasses.push("js-gantt-bar-milestone");
          if (this.options.selectedTask === `${task.id}`) {
            taskBarClasses.push("js-gantt-selected-task-bar");
          }
        } else {
          taskBarClasses.push("js-gantt-bar-parent-task");
          if (this.options.selectedTask === `${task.id}`) {
            taskBarClasses.push("js-gantt-selected-task-bar");
          }
        }

        let taskLeft = cellBefore * this.calculateGridWidth(start_date, "day");
        const hourLeft = this.getPxByTime(start_date, "left");
        taskLeft += hourLeft;

        const barTaskHeight = Math.floor((this.options.row_height * 80) / 100);
        const taskTop = rowCount * this.options.row_height + Math.floor((this.options.row_height * 10) / 100);

        // Build task bar styles
        const taskBarStyles = {
          left: `${taskLeft}px`,
          top: `${taskTop}px`,
          height: `${barTaskHeight}px`,
          lineHeight: `${barTaskHeight}px`,
        };

        // Handle milestone sizing
        if (task.type === "milestone") {
          taskBarStyles.width = `${barTaskHeight}px`;
          taskBarStyles.left = `${(cellBefore + 1) * this.calculateGridWidth(start_date, "day")}px`;
        }

        // Using imported createElement utility
        const jsGanttBarTask = createElement("div", {
          classes: taskBarClasses,
          styles: taskBarStyles,
          attributes: {
            "task-parent": j,
            "data-task-pos": 0,
            "js-gantt-taskbar-id": task.id,
          },
        });

        // Apply custom task color
        if (task.taskColor && task.type !== "milestone") {
          jsGanttBarTask.style.setProperty(
            "background-color",
            this.changeOpacity(task.taskColor),
            "important"
          );
          jsGanttBarTask.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        //add custom class from user
        this.addClassesFromFunction(
          this.templates.task_class,
          jsGanttBarTask,
          start_date,
          end_date,
          task
        );

        // Using imported createElement utility
        const jsGanttBarTaskContent = createElement("div", {
          classes: ["js-gantt-bar-task-content", "parent-task-bar-content"],
        });

        if (task.type === "milestone" && task.taskColor) {
          jsGanttBarTaskContent.style.setProperty(
            "background-color",
            task.taskColor,
            "important"
          );

          jsGanttBarTaskContent.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        const that = this;

        // handle double click event
        jsGanttBarTask.addEventListener("dblclick", handleDblClick);

        function handleDblClick() {
          // custom event handler
          that.dispatchEvent("onBeforeTaskDblClick", {
            task,
          });

          // if onBeforeTaskDblClick return false then do not drag the task
          if (that.eventValue === false) {
            that.eventValue = true;
            return;
          }

          that.dispatchEvent("onTaskDblClick", {
            task,
          });

          that.showLightBox(task);
        }

        const { userAgent } = navigator;

        // Handle mouseover event
        jsGanttBarTask.addEventListener("mouseover", handleMouseOver);

        function handleMouseOver() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.add("hovered");
          }

          that.updateTooltipBody(task);
        }

        // Handle mouseleave event
        jsGanttBarTask.addEventListener("mouseleave", handleMouseLeave);

        function handleMouseLeave() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.remove("hovered");
          }

          that.hideTooltip();
        }

        if (
          this.callTemplate("task_drag", "resize", task) &&
          task.type !== "milestone"
        ) {
          // left side resizer - using imported createElement
          const jsGanttTaskDragLeft = createElement("div", {
            classes: ["js-gantt-task-drag-left"],
          });

          // right side resizer - using imported createElement
          const jsGanttTaskDragRight = createElement("div", {
            classes: ["js-gantt-task-drag-right"],
          });

          jsGanttBarTask.append(jsGanttTaskDragLeft, jsGanttTaskDragRight);
          this.resizeTaskBars(
            jsGanttTaskDragLeft,
            jsGanttBarTask,
            "left",
            task
          );

          this.resizeTaskBars(
            jsGanttTaskDragRight,
            jsGanttBarTask,
            "right",
            task
          );
        }

        const taskDates = this.getDates(start_date, end_date);

        let taskProgress;
        // Using imported isFunction utility
        const isTaskProgress = isFunction(this.options.taskProgress)
          ? this.options.taskProgress(task)
          : this.options.taskProgress;
        if (isTaskProgress === true && task.type !== "milestone") {
          let progressPer = task.progress || 0;
          progressPer = progressPer > 100 ? 100 : progressPer;

          // Using imported createElement utility
          const taskProgressContainer = createElement("div", {
            classes: ["js-gantt-task-progress-wrapper"],
          });

          taskProgress = createElement("div", {
            classes: ["js-gantt-task-progress"],
            styles: { width: `${progressPer}%` },
          });

          if (task.taskColor) {
            taskProgress.style.setProperty(
              "background-color",
              task.taskColor,
              "important"
            );
          }

          taskProgressContainer.append(taskProgress);

          // Using imported createElement utility
          const taskProgressDrag = createElement("div", {
            classes: ["js-gantt-task-progress-drag"],
            styles: { left: `${progressPer}%` },
          });

          // update the task progress onAfterTaskUpdate
          this.attachEvent("onAfterTaskUpdate", () => {
            const progress = task.progress || 0;
            taskProgress.style.width = `${progress}%`;
            taskProgressDrag.style.left = `${progress}%`;
          });

          jsGanttBarTask.append(taskProgressContainer, taskProgressDrag);
          this.dragTaskProgress(
            taskProgressDrag,
            taskProgress,
            jsGanttBarTask,
            task
          );
        }

        if (this.callTemplate("task_drag", "move", task)) {
          this.resizeTaskBars(
            jsGanttBarTaskContent,
            jsGanttBarTask,
            "move",
            task
          );
        }

        // link control pointers - using imported isFunction
        const isAddLinks = isFunction(this.options.addLinks)
          ? this.options.addLinks(task)
          : this.options.addLinks;

        if (isAddLinks === true) {
          // left point - using imported createElement
          const leftLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-left-point"],
          });

          const leftPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          // right point - using imported createElement
          const rightLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-right-point"],
          });

          const rightPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          leftLinkPoint.append(leftPoint);
          rightLinkPoint.append(rightPoint);
          jsGanttBarTask.append(leftLinkPoint, rightLinkPoint);

          this.createNewLink(rightPoint, jsGanttBarTask, task.id, "right");

          this.createNewLink(leftPoint, jsGanttBarTask, task.id, "left");
        }

        //add custom task color picker - using imported isFunction
        const isCustomColor = isFunction(this.options.taskColor)
          ? this.options.taskColor(task)
          : this.options.taskColor;

        if (isCustomColor) {
          // Using imported createElement utility
          const colorPicker = createElement("div", {
            classes: ["js-gantt-task-color-picker"],
          });

          const colorInput = createElement("input", {
            attributes: { type: "color" },
          });

          setTimeout(() => {
            const backgroundElement =
              task.type === "milestone"
                ? jsGanttBarTaskContent
                : jsGanttBarTask;

            // Get the computed style of the element
            const jsGanttBarTaskStyle =
              window.getComputedStyle(backgroundElement);

            // Get the background-color property value
            const backgroundColor =
              jsGanttBarTaskStyle.getPropertyValue("background-color");

            colorInput.value =
              task.taskColor || this.rgbaToHex(backgroundColor);
          }, 0);

          colorPicker.append(colorInput);
          jsGanttBarTask.append(colorPicker);
          this.changeTaskbarColor(
            jsGanttBarTask,
            colorInput,
            taskProgress,
            jsGanttBarTaskContent,
            task
          );
        }

        if (task.type !== "milestone") {
          let taskWidth =
            taskDates.length * this.calculateGridWidth(end_date, "day");

          if (taskWidth === 0 || !taskWidth) {
            addClass(jsGanttBarTask, "js-gantt-d-none");
          }

          let hourWidth = this.getPxByTime(end_date, "width");
          const hourLeft = this.getPxByTime(start_date, "left");
          hourWidth += hourLeft;
          taskWidth -= hourWidth;
          setStyles(jsGanttBarTask, { width: `${taskWidth}px` });
        }

        let sideContent;
        if (task.type === "milestone") {
          // Using imported createElement utility
          sideContent = createElement("div", {
            classes: ["js-gantt-side-content"],
            html: this.callTemplate(
              "taskbar_text",
              new Date(start_date),
              new Date(end_date),
              task
            ),
          });
          jsGanttBarTask.append(sideContent);
        } else {
          jsGanttBarTaskContent.innerHTML = this.callTemplate(
            "taskbar_text",
            new Date(start_date.setHours(0)),
            new Date(end_date.setHours(0)),
            task
          );
        }
        jsGanttBarTask.append(jsGanttBarTaskContent);

        this.attachEvent("onAfterTaskUpdate", () => {
          const innerHTML = this.callTemplate(
            "taskbar_text",
            start_date.setHours(0),
            end_date.setHours(0),
            task
          );

          if (task.type === "milestone") {
            sideContent.innerHTML = innerHTML;
          } else {
            jsGanttBarTaskContent.innerHTML = innerHTML;
          }
        });

        jsGanttBarsArea.append(jsGanttBarTask);

        rowCount += 1;
      }

      // if children exist
      if (
        task?.children?.length &&
        this.options.openedTasks.includes(task.id) &&
        !this.options.splitTask
      ) {
        rowCount = this.createChildTaskBars(
          task.children,
          rowCount,
          jsGanttBarsArea,
          j
        );
      }
    }

    // Using querySelector for DOM lookups
    const barsArea = querySelector("#js-gantt-bars-area", document);

    if (barContainer === null) {
      barContainer = querySelector("#js-gantt-timeline-data", document);
    }

    // if barsArea exist then remove barsArea
    if (barsArea && !isFromRender) {
      barsArea.replaceWith(jsGanttBarsArea);
    } else {
      barContainer.append(jsGanttBarsArea);
    }
    if (!isFromRender) {
      // create links if addLinks is true
      const isLinksAreaExist = querySelector("#js-gantt-links-area", this.element);

      // if lines already exist remove all lines
      if (isLinksAreaExist) {
        isLinksAreaExist.innerHTML = "";
      } else if (barContainer) {
        // Using imported createElement utility
        const linksArea = createElement("div", {
          id: "js-gantt-links-area",
          classes: ["js-gantt-links-area"],
        });
        barContainer.append(linksArea);
      }

      for (let i = 0; i < this.options.links.length; i++) {
        this.createLinks(
          this.options.links[i].source,
          this.options.links[i].target,
          this.options.links[i]
        );
      }
    }
  }

  /**
   * Method to get the start and end dates of a week.
   * Uses imported addDays utility for date calculations.
   * @param {Date} weekDate - Any date within the week for which you want the start and end dates.
   * @returns {{ startDate: Date, endDate: Date }} - The start and end dates of the week.
   */
  getWeekStartEndDate(weekDate) {
    const date = new Date(weekDate);

    const dayOfWeek = date.getDay();
    const diffToStart = (dayOfWeek + 7 - this.options.weekStart) % 7;

    // Calculate the start date of the week using imported addDays
    const startDate = addDays(date, -diffToStart);

    // Calculate the end date of the week using imported addDays
    const endDate = addDays(startDate, 6);

    // Return the start and end dates
    return { startDate, endDate };
  }

  // Method to add click listener
  addClickListener(element, callback) {
    element.addEventListener("click", callback);
  }

  // Method to resize columns
  resizeColumns(
    resizer,
    attr,
    headCell,
    headCellContainer,
    minWidth,
    maxWidth,
    columnIndex,
    sidebar,
    isRight
  ) {
    let colResizing = false,
      resizeArea,
      that = this,
      startX;

    resizer.removeEventListener("mousedown", handleMouseDown);
    resizer.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(event) {
      startX = event.x;

      // Using imported createElement utility
      resizeArea = createElement("div", {
        id: "js-gantt-resize-area",
        classes: ["js-gantt-grid-resize-area"],
      });

      const resizeLeft = sidebar.offsetLeft + headCell.offsetLeft;
      const jsGanttLayout = querySelector("#js-gantt-layout", document);
      const resizeAreaWidth = headCell.offsetWidth;

      // Using imported setStyles utility
      setStyles(resizeArea, {
        left: `${resizeLeft}px`,
        height: `${jsGanttLayout.scrollHeight}px`,
        width: `${
          resizeAreaWidth < (minWidth || 80)
            ? minWidth || 80
            : resizeAreaWidth > maxWidth
              ? maxWidth
              : resizeAreaWidth
        }px`,
      });

      jsGanttLayout.append(resizeArea);
      document.addEventListener("mousemove", resize, false);
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp(e) {
      document.removeEventListener("mousemove", resize, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      resizeArea.remove();
      if (colResizing) {
        // Using imported querySelectorAll utility
        const columns = querySelectorAll(`[${attr}]`, that.element);
        let colWidth = columns[0].offsetWidth + (e.x - startX);
        colWidth =
          colWidth < (minWidth || 80)
            ? minWidth || 80
            : colWidth > maxWidth
              ? maxWidth
              : colWidth;
        for (const col of columns) {
          setStyles(col, { width: `${colWidth}px` });
        }

        if (!isRight) {
          that.options.columns[columnIndex].width = colWidth;
        } else {
          that.options.rightGrid[columnIndex].width = colWidth;
        }

        const headerCell = document.getElementsByClassName(
          isRight ? "right-head-cell" : "head-cell"
        );
        const totalHeadWidth = Array.from(headerCell).reduce(
          (totalWidth, headCell) => totalWidth + headCell.offsetWidth,
          0
        );
        if (!isRight) {
          const sidebarEl = querySelector("#js-gantt-grid-left-data", document);
          setStyles(sidebarEl, {
            width: `${totalHeadWidth + 1}px`,
            minWidth: `${totalHeadWidth + 1}px`,
          });

          that.options.sidebarWidth = sidebarEl.offsetWidth;
        }

        let resizerLeft = 0;
        for (let j = 0; j < headerCell.length; j++) {
          resizerLeft += headerCell[j].offsetWidth;
          let resizerWrap;
          if (!isRight) {
            resizerWrap = querySelector(`#js-gantt-col-resizer-wrap-${j}`, document);
          } else {
            resizerWrap = querySelector(`#js-gantt-col-resizer-wrap-r-${j}`, document);
          }
          if (resizerWrap) {
            setStyles(resizerWrap, { left: `${resizerLeft}px` });
          }
        }

        if (!isRight) {
          setStyles(headCellContainer, { width: `${resizerLeft}px` });

          const leftGrid = querySelector("#js-gantt-left-grid", document);
          setStyles(leftGrid, { width: `${resizerLeft}px` });

          const leftResizer = querySelector("#js-gantt-left-layout-resizer-wrap", document);
          const leftDataEl = querySelector("#js-gantt-grid-left-data", document);
          setStyles(leftResizer, { left: `${leftDataEl.offsetWidth}px` });
        } else {
          const rightResizer = querySelector("#js-gantt-timeline-resizer-wrap", that.element);
          setStyles(headCellContainer, { width: `${totalHeadWidth}px` });
          setStyles(sidebar, {
            width: `${totalHeadWidth}px`,
            minWidth: `${totalHeadWidth}px`,
          });
          const resizerLeft = sidebar.offsetLeft - rightResizer.offsetLeft;
          setStyles(rightResizer, { left: `${rightResizer.offsetLeft + resizerLeft}px` });
          that.options.rightGridWidth = sidebar.offsetWidth;
        }
        // rerender the calendar and scale
        if (
          that.calculateTimeLineWidth("updated") !==
          that.calculateTimeLineWidth("current")
        ) {
          that.updateBody();
        } else {
          const jsGanttLayout = querySelector(".js-gantt-layout", that.element);
          that.createScrollbar(jsGanttLayout);
        }
      }
      colResizing = false;
    }

    // resize the column
    function resize(e) {
      colResizing = true;
      const newWidth = headCell.offsetWidth + (e.x - startX);
      if (newWidth <= (minWidth || 80)) {
        setStyles(resizeArea, { width: `${minWidth || 80}px` });
        return;
      } else if (newWidth >= maxWidth) {
        setStyles(resizeArea, { width: `${maxWidth}px` });
        return;
      }

      const resizeEl = querySelector("#js-gantt-resize-area", document);
      setStyles(resizeEl, { width: `${newWidth}px` });
    }
  }

  // Method to resize sidebar
  resizeSidebar(resizer, resizerLine, sidebar) {
    let sidebarResizing = false,
      that = this,
      startX,
      sidebarStartWidth;

    resizer.removeEventListener("mousedown", handleMouseDown);
    resizer.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(event) {
      startX = event.x;
      sidebarStartWidth = sidebar.offsetWidth;
      resizerLine.classList.add("resizing");

      // mouse move event
      document.addEventListener("mousemove", resize, false);
      // mouseup event
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp(e) {
      document.removeEventListener("mousemove", resize, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      if (sidebarResizing) {
        const rightResizer = that.element.querySelector(
          "#js-gantt-timeline-resizer-wrap"
        );
        // add the all columns minWidth
        const totalMinWidth = that.options.columns.reduce(
          (totalMinWidth, column) => totalMinWidth + column.min_width,
          0
        );

        let left = e.x;
        if (rightResizer) {
          let { x } = e;
          x =
            rightResizer.offsetLeft - 80 <= resizer.offsetLeft
              ? rightResizer.offsetLeft - resizer.offsetLeft
              : 80;

          left = e.x - (80 - x);
        }

        let resizerLeft = 0,
          headerCell = document.getElementsByClassName("head-cell"),
          sidebarData = that.element.querySelector("#js-gantt-left-grid");

        if (that.element.offsetWidth - left <= 50) {
          left -= 50;
        }

        const singleColIncrease = (left - startX) / that.options.columns.length;

        for (let j = 0; j < headerCell.length; j++) {
          const columns = that.element.querySelectorAll(
            `[data-column-index="${j}"]`
          );

          let incrasedWidth = headerCell[j].offsetWidth + singleColIncrease;

          const resizerWrap = document.getElementById(
            `js-gantt-col-resizer-wrap-${j}`
          );

          incrasedWidth =
            incrasedWidth > (that.options.columns[j].min_width || 80)
              ? incrasedWidth
              : that.options.columns[j].min_width || 80;

          // set the sidebar columns width
          for (const col of columns) {
            col.style.width = `${incrasedWidth}px`;
          }

          that.options.columns[j].width = incrasedWidth;

          // set the sidebar columns resizer left
          resizerLeft += headerCell[j].offsetWidth;
          if (resizerWrap) {
            resizerWrap.style.left = `${resizerLeft}px`;
          }
        }

        const totalHeadWidth = Array.from(headerCell).reduce(
          (totalWidth, headCell) => totalWidth + headCell.offsetWidth,
          0
        );

        // set the sidebar width
        const sidebarWidth = totalHeadWidth;

        sidebar.style.width = `${
          sidebarWidth < totalMinWidth ? totalMinWidth : sidebarWidth
        }px`;
        sidebar.style.minWidth = `${
          sidebarWidth < totalMinWidth ? totalMinWidth : sidebarWidth
        }px`;
        resizer.style.left = `${
          sidebarWidth < totalMinWidth ? totalMinWidth : sidebarWidth
        }px`;

        that.options.sidebarWidth = sidebar.offsetWidth;

        // set the sidebar header and body width
        sidebarData.style.width = `${sidebar.offsetWidth}px`;

        // rerender the calendar and scale
        if (
          that.calculateTimeLineWidth("updated") !==
          that.calculateTimeLineWidth("current")
        ) {
          that.updateBody();
        } else {
          const jsGanttLayout = that.element.querySelector(".js-gantt-layout");
          that.createScrollbar(jsGanttLayout);
        }
      }
      resizerLine.classList.remove("resizing");
      sidebarResizing = false;
    }

    // resize the sidebar
    function resize(e) {
      sidebarResizing = true;
      const size = sidebarStartWidth + (e.x - startX);
      if (that.element.offsetWidth - size <= 50) {
        return;
      }
      resizer.style.left = `${size}px`;
    }
  }

  // add today flag
  addTodayFlag() {
    // return from here if current date is out of range
    if (this.outOfGanttRange(new Date())) {
      return;
    }

    const isFullWeek = this.options.fullWeek;
    const isWeekend = this.options.weekends.includes(
      this.#dateFormat.day_short[new Date().getDay()]
    );

    if (!isFullWeek && isWeekend) {
      return;
    }

    const isTodayExist = querySelector("#js-gantt-marker-today", document);
    if (!isTodayExist) {
      // Using imported createElement utility
      const todayFlagText = createElement("div", {
        classes: ["js-gantt-marker-today-text"],
        html: "Today",
      });

      // Calculate the difference in days
      let daysDiff = this.getDates(
        new Date(this.options.startDate),
        new Date()
      );
      daysDiff = daysDiff.length - 1 || 0;
      const colWidth = this.calculateGridWidth(new Date(), "day");

      const todayFlag = createElement("div", {
        id: "js-gantt-marker-today",
        classes: ["js-gantt-marker-today"],
        attributes: { title: this.formatDateToString("%d %F %Y", new Date()) },
        styles: { left: `${colWidth * daysDiff + colWidth / 2}px` },
      });

      todayFlag.append(todayFlagText);
      this.markerArea.append(todayFlag);
    }
  }

  // remove today flag
  removeTodayFlag() {
    const today = querySelector("#js-gantt-marker-today", document);
    if (today) {
      today.remove();
    }
  }

  /**
   * Formats a date into the specified format.
   * @param {string} format - The desired format for the date.
   * @param {Date} date - The date to format.
   * @returns {string} The date formatted as a string in the specified format.
   */
  formatDateToString(format, date) {
    // Use I18nManager if available for locale-aware formatting
    const dateFormat = this.#i18nManager
      ? this.#i18nManager.getTranslations()
      : this.#dateFormat;
    date = new Date(date);

    return format.replace(/%[a-zA-Z]/g, (format) => {
      switch (format) {
        case "%d":
          return toFixed(date.getDate());
        case "%m":
          return toFixed(date.getMonth() + 1);
        case "%q":
          return this.getQuarterOfDate(date);
        case "%j":
          return date.getDate();
        case "%n":
          return date.getMonth() + 1;
        case "%y":
          return toFixed(date.getFullYear() % 100);
        case "%Y":
          return date.getFullYear();
        case "%D":
          return dateFormat.day_short[date.getDay()];
        case "%l":
          return dateFormat.day_full[date.getDay()];
        case "%M":
          return dateFormat.month_short[date.getMonth()];
        case "%F":
          return dateFormat.month_full[date.getMonth()];
        case "%h":
          return toFixed(((date.getHours() + 11) % 12) + 1);
        case "%g":
          return ((date.getHours() + 11) % 12) + 1;
        case "%G":
          return date.getHours();
        case "%H":
          return toFixed(date.getHours());
        case "%i":
          return toFixed(date.getMinutes());
        case "%a":
          return date.getHours() > 11 ? "pm" : "am";
        case "%A":
          return date.getHours() > 11 ? "PM" : "AM";
        case "%s":
          return toFixed(date.getSeconds());
        case "%W":
          return toFixed(_getWeekNumber(date));
        default:
          return format;
      }
    });

    function toFixed(t) {
      return t < 10 ? `0${t}` : t;
    }

    // get week number
    function _getWeekNumber(t) {
      if (!t) {
        return !1;
      }
      let n = t.getDay();
      0 === n && (n = 7);
      const i = new Date(t.valueOf());
      i.setDate(t.getDate() + (4 - n));
      const r = i.getFullYear(),
        a = Math.round((i.getTime() - new Date(r, 0, 1).getTime()) / 864e5);
      return 1 + Math.floor(a / 7);
    }
  }

  /**
   * Adds a specified amount of time to a given date.
   * @param {Date} date - The original date.
   * @param {number} amount - The amount of time to add.
   * @param {string} unit - The unit of time to add ('day', 'week', 'month', 'year', 'hour', 'minute').
   * @returns {Date} The new date with the added time.
   */
  add(date, amount, unit) {
    let newDate = new Date(date.valueOf());
    switch (unit) {
      case "day":
        newDate = this._add_days(newDate, amount, date);
        break;
      case "week":
        newDate = this._add_days(newDate, 7 * amount, date);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case "year":
        newDate.setYear(newDate.getFullYear() + amount);
        break;
      case "hour":
        newDate.setTime(newDate.getTime() + 60 * amount * 60 * 1e3);
        break;
      case "minute":
        newDate.setTime(newDate.getTime() + 60 * amount * 1e3);
        break;
      default:
        return this[`add_${unit}`](date, amount, unit);
    }
    return newDate;
  }

  // add days in date
  _add_days(t, e, n) {
    t.setDate(t.getDate() + e);
    const i = e >= 0,
      r = !n.getHours() && t.getHours(),
      a =
        t.getDate() <= n.getDate() ||
        t.getMonth() < n.getMonth() ||
        t.getFullYear() < n.getFullYear();
    return (
      i && r && a && t.setTime(t.getTime() + 36e5 * (24 - t.getHours())),
        t
    );
  }

  // Function to strip time from date - uses imported utility
  stripTime(date) {
    return stripTime(date);
  }

  // request browser fullscreen
  requestFullScreen() {
    const sidebar = document.getElementById("js-gantt-grid-left-data");
    const resizer = document.getElementById(
      "js-gantt-left-layout-resizer-wrap"
    );

    document.body.requestFullscreen?.() ||
    // For Firefox
    document.body.mozRequestFullScreen?.() ||
    // For Chrome and Safari
    document.body.webkitRequestFullscreen?.() ||
    // For Internet Explorer
    document.body.msRequestFullscreen?.();
    this.element.classList.add("js-gantt-fullScreen");

    this.fullScreen = true;
    const isVerScrollExist = this.element.querySelectorAll(
      ".js-gantt-ver-scroll-cell"
    );
    if (isVerScrollExist && isVerScrollExist.length > 0) {
      for (const scroll of isVerScrollExist) {
        scroll.remove();
      }
    }

    this.dispatchEvent("onRequestFullScreen", { type: "requestFullScreen" });

    if (
      this.calculateTimeLineWidth("updated") !==
      this.calculateTimeLineWidth("current")
    ) {
      this.updateBody();
    } else {
      const jsGanttLayout = this.element.querySelector(".js-gantt-layout");
      const verScroll =
        this.element.querySelector(".js-gantt-ver-scroll")?.scrollTop || 0;
      const horScroll =
        this.element.querySelector(".js-gantt-hor-scroll")?.scrollLeft || 0;
      this.createScrollbar(jsGanttLayout, verScroll, horScroll);
    }
    resizer.style.left = `${sidebar.offsetWidth}px`;
  }

  // exit browser fullscreen
  exitFullScreen(listener = false) {
    if (this.fullScreen !== true) {
      return;
    }
    this.element.classList.remove("js-gantt-fullScreen");
    if (listener !== true) {
      document.body.exitFullscreen?.() ||
      // For Firefox
      document.body.mozCancelFullScreen?.() ||
      // For Chrome and Safari
      document.body.webkitExitFullscreen?.() ||
      // For Internet Explorer
      document.body.msExitFullscreen?.();
    }

    this.fullScreen = false;

    const isVerScrollExist = this.element.querySelectorAll(
      ".js-gantt-ver-scroll-cell"
    );

    if (isVerScrollExist) {
      for (const scroll of isVerScrollExist) {
        scroll.remove();
      }
    }

    if (
      this.calculateTimeLineWidth("updated") !==
      this.calculateTimeLineWidth("current")
    ) {
      setTimeout(() => {
        this.updateBody();
      }, 0);
    } else {
      const jsGanttLayout = this.element.querySelector(".js-gantt-layout");
      this.createScrollbar(jsGanttLayout);
    }

    // manage tooltip
    this.hideTooltip();

    // handle custom event
    this.dispatchEvent("onExitFullScreen", { type: "exitFullScreen" });
  }

  /**
   * Method to expand all rows of gantt
   */
  expandAll() {
    const childRows = this.element.querySelectorAll(".js-gantt-child-row");
    const toggleIcons = this.element.querySelectorAll(".js-gantt-tree-close");

    for (const icon of toggleIcons) {
      icon.classList.remove("js-gantt-tree-close");
      icon.classList.add("js-gantt-tree-open");
    }

    for (const row of childRows) {
      if (row.classList.contains("js-gantt-d-none")) {
        row.classList.add("js-gantt-d-flex");
        row.classList.remove("js-gantt-d-none");
      }
    }

    this.options.openedTasks = this.originalData.map((task) => task?.id);
    this.createTaskBars();
    const jsGanttLayout = this.element.querySelector("#js-gantt-layout");
    this.createScrollbar(jsGanttLayout);
    this.options.collapse = false;
  }

  /**
   * Method to collapse all rows of gantt
   */
  collapseAll() {
    const childRows = this.element.querySelectorAll(".js-gantt-child-row");
    const toggleIcons = this.element.querySelectorAll(".js-gantt-tree-icon");

    // Make the opened task array empty
    this.options.openedTasks.length = 0;

    // Change all the toggle icons to close
    for (const icon of toggleIcons) {
      icon.classList.remove("js-gantt-tree-open");
      icon.classList.add("js-gantt-tree-close");
    }

    // Hide all the child rows
    for (const row of childRows) {
      row.classList.add("js-gantt-d-none");
      row.classList.remove("js-gantt-d-flex");
    }

    // Again create all taskBars
    this.createTaskBars();
    const jsGanttLayout = this.element.querySelector("#js-gantt-layout");
    this.createScrollbar(jsGanttLayout);
    this.options.collapse = true;
  }

  // get start and end dates from children array
  getStartAndEndDate(data) {
    const that = this;

    function getDates(array) {
      let dates = [];
      array.forEach((item) => {
        if (Array.isArray(item.children) && item.children.length > 0) {
          dates = dates.concat(getDates(item.children));
        }
        if (
          that.hasProperty(item, "start_date") &&
          that.hasProperty(item, "end_date")
        ) {
          dates.push(new Date(item.start_date));
          dates.push(new Date(item.end_date || item.start_date));
        }
      });
      return dates;
    }

    // get lowest and highest dates
    const dateValues = getDates(data);
    const lowestDate = new Date(Math.min(...dateValues));
    const highestDate = new Date(Math.max(...dateValues));

    return { startDate: lowestDate, endDate: highestDate };
  }

  // resize or move Task Bars
  resizeTaskBars(resizer, taskBar, type, task) {
    let startX,
      startY,
      startWidth,
      startLeft,
      startTop,
      that = this,
      rightPanelScroll,
      rightPanelScrollWidth,
      resizeTask = false,
      startRightPanelScrollLeft,
      startRightPanelScrollTop,
      autoScroll = false,
      autoScrollTimer,
      autoScrollDelay = 5, // Adjust the scroll delay by changing the value here
      originalTask,
      initStartDate,
      initEndDate,
      scrollSpeed = 5, // Adjust the scroll speed by changing the value here
      willRender = false,
      scrollContainerTop,
      scrollThresholdTop,
      scrollThresholdBottom,
      scrollContainer,
      scrollThresholdRight,
      scrollThresholdLeft,
      allTaskbars;

    const timelineCellWidth = this.calculateGridWidth(task.start_date, "day");

    resizer.removeEventListener("mousedown", handleMouseDown);
    resizer.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(event) {
      rightPanelScroll = document.getElementById("js-gantt-timeline-cell");
      rightPanelScrollWidth = rightPanelScroll.scrollWidth;
      allTaskbars = that.element.querySelectorAll(".js-gantt-bar-task");

      scrollContainerTop =
        that.element.offsetTop + rightPanelScroll.offsetHeight;
      scrollThresholdTop = scrollContainerTop - 30;
      scrollThresholdBottom =
        that.element.offsetTop + that.calculateScaleHeight("scroll") + 30;

      scrollContainer = that.element.offsetLeft + rightPanelScroll.offsetLeft;
      scrollThresholdRight =
        scrollContainer + rightPanelScroll.offsetWidth - 30;
      scrollThresholdLeft = scrollContainer + 30;

      initStartDate = task.start_date;
      initEndDate = task.end_date;
      startRightPanelScrollLeft = rightPanelScroll.scrollLeft;
      startRightPanelScrollTop = rightPanelScroll.scrollTop;
      startX = event.x;
      startY = event.y;
      startWidth = taskBar.offsetWidth;
      startLeft = taskBar.offsetLeft;
      startTop = taskBar.offsetTop;
      originalTask = { ...task };

      document.addEventListener("mousemove", resize, false);
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp() {
      autoScroll = false;
      taskBar.classList.remove("task-dragging");
      document.removeEventListener("mousemove", resize, false);
      document.removeEventListener("mouseup", handleMouseUp, false);

      if (resizeTask === true) {
        let parentTask;
        const taskbarIndex = Math.floor(
          taskBar.offsetTop / that.options.row_height
        );
        const currentPosTaskbar = allTaskbars[taskbarIndex];
        const isTaskbarIndexInRange =
          taskbarIndex > -1 && taskbarIndex < allTaskbars.length;
        const taskParentId = currentPosTaskbar?.getAttribute("task-parent");
        const taskPosition = +currentPosTaskbar?.getAttribute("data-task-pos");
        const taskPositionId = currentPosTaskbar?.getAttribute(
          "js-gantt-taskbar-id"
        );
        const currentTaskParentId = taskBar.getAttribute("task-parent");
        const currentTaskPosition = +taskBar.getAttribute("data-task-pos");

        const updateData = (parentId, task, taskPositionId) => {
          const currentIndex = that.originalData.findIndex(
            (obj) => obj.id == task.id
          );
          const newIndexTask = that.getTask(taskPositionId);
          const newIndex = that.originalData.findIndex(
            (obj) => obj.id == taskPositionId
          );

          that.originalData.splice(currentIndex, 1); // Remove the object from the current position
          task.parent =
            parentId.length > 1 ? newIndexTask.parent : newIndexTask.id;
          that.originalData.splice(newIndex, 0, task); // Insert the object at the new position
        };

        if (isTaskbarIndexInRange) {
          const currentTask = that.getTask(taskPositionId);
          const parentId =
            taskParentId.length > 1 ? currentTask.parent : currentTask.id;
          parentTask = that.getTask(parentId);
        } else {
          parentTask = null;
        }

        // handle custom event
        that.dispatchEvent("onBeforeTaskDrop", {
          task,
          mode: type === "move" ? "move" : "resize",
          parentTask,
          oldParentTask: that.getTask(task.parent),
        });

        if (type === "move" && that.eventValue === false) {
          taskBar.style.top = `${startTop}px`;
          taskBar.style.left = `${startLeft}px`;
          resizer.style.cursor = "pointer";
          that.#updateTask(task, initStartDate, initEndDate, taskBar);
          resizeTask = false;
          that.eventValue = true;
        } else {
          if (type === "move") {
            resizer.style.cursor = "pointer";

            // if current task position or task parent is not same
            // update the task position in array
            if (
              (taskParentId !== currentTaskParentId ||
                taskPosition !== currentTaskPosition) &&
              isTaskbarIndexInRange &&
              taskParentId !==
              currentTaskParentId.slice(0, currentTaskParentId.length - 1) &&
              !that.options.splitTask
            ) {
              updateData(taskParentId, task, taskPositionId);
              willRender = true;
            } else {
              taskBar.style.top = `${startTop}px`;
            }
          }

          const gridWidth = that.calculateGridWidth(
            task.start_date,
            that.options.zoomLevel !== "hour" ? "day" : ""
          );

          // set the left and width to whole column
          taskBar.style.left = `${Math.round(taskBar.offsetLeft / gridWidth) * gridWidth}px`;
          if (type !== "move") {
            taskBar.style.width = `${Math.round(taskBar.offsetWidth / gridWidth) * gridWidth}px`;
          }
        }
        if (task.type === "milestone") {
          task.end_date = new Date(task.start_date).setHours(23, 59, 59);
        }

        that.#updateTask(
          task,
          task.start_date,
          task.end_date,
          taskBar,
          "mouseup"
        );

        if (willRender) {
          // render the chart again
          that.render();
          willRender = false;
        }

        // handle custom event
        that.dispatchEvent("onAfterTaskDrag", {
          task,
          mode: type === "move" ? "move" : "resize",
          parentTask: that.getTask(task.parent),
        });
      }
      resizeTask = false;
    }

    // resize the taskBar
    function resize(e) {
      if (resizeTask === false) {
        // custom event handler
        that.dispatchEvent("onBeforeTaskDrag", {
          task,
          mode: type === "move" ? "move" : "resize",
        });
      }

      resizeTask = true;

      // if onBeforeTaskDrag return false then do not drag the task
      if (that.eventValue === false) {
        return;
      }

      function startAutoScroll(type) {
        if (type === "right") {
          rightPanelScroll.scrollLeft += scrollSpeed;
          if (
            rightPanelScroll.scrollLeft >=
            rightPanelScroll.scrollWidth - rightPanelScroll.clientWidth
          ) {
            autoScroll = false;
            return;
          }
        } else if (type === "left") {
          rightPanelScroll.scrollLeft -= scrollSpeed;
          if (rightPanelScroll.scrollLeft <= 0) {
            autoScroll = false;
            return;
          }
        } else if (type === "top") {
          rightPanelScroll.scrollTop += scrollSpeed;
          if (rightPanelScroll.scrollTop <= 0) {
            autoScroll = false;
            return;
          }
        } else if (type === "bottom") {
          rightPanelScroll.scrollTop -= scrollSpeed;
          if (
            rightPanelScroll.scrollTop >=
            rightPanelScroll.scrollHeight - rightPanelScroll.clientHeight
          ) {
            autoScroll = false;
            return;
          }
        }

        if (autoScroll) {
          if (autoScrollTimer) {
            clearInterval(autoScrollTimer);
          }
          autoScrollTimer = setTimeout(() => {
            startAutoScroll(type);
          }, autoScrollDelay);
        }
      }

      // auto scroll the timeline left or right
      if (e.clientX > scrollThresholdRight - window.scrollX) {
        autoScroll = true;
        startAutoScroll("right");
      } else if (e.clientX < scrollThresholdLeft - window.scrollX) {
        autoScroll = true;
        startAutoScroll("left");
      } else {
        autoScroll = false;
      }

      // auto scroll the timeline top or bottom
      if (e.clientY > scrollThresholdTop - window.scrollY) {
        autoScroll = true;
        startAutoScroll("top");
      } else if (e.clientY < scrollThresholdBottom - window.scrollY) {
        autoScroll = true;
        startAutoScroll("bottom");
      }

      // move the taskbar
      if (type === "move") {
        resizer.style.cursor = "move";
        const left =
          startLeft +
          (e.x - startX) -
          (startRightPanelScrollLeft - rightPanelScroll.scrollLeft);

        taskBar.style.left = `${left}px`;
        if (!that.options.splitTask) {
          taskBar.style.top = `${
            startTop +
            (e.y - startY) -
            (startRightPanelScrollTop - rightPanelScroll.scrollTop)
          }px`;
        }
        taskBar.classList.add("task-dragging");

        if (that.options.dropArea) {
          const taskbarIndex = Math.floor(
            taskBar.offsetTop / that.options.row_height
          );
          const currentPosTaskbar = allTaskbars[taskbarIndex];
          const isTaskbarIndexInRange =
            taskbarIndex > -1 && taskbarIndex < allTaskbars.length;
          if (isTaskbarIndexInRange) {
            const taskPos = currentPosTaskbar.getAttribute("task-parent");
            const pos = taskPos?.slice(0, -1) || taskPos;
            const rows = that.element.querySelectorAll(
              `[js-gantt-data-task-id^="${pos}"].js-gantt-task-row`
            );
            const dropAreaHeight =
              rows[rows.length - 1].offsetTop -
              rows[0].offsetTop +
              that.options.row_height;
            const dropArea = that.element.querySelector(".drop-area");
            dropArea.style.top = `${rows[0].offsetTop}px`;
            dropArea.style.height = `${dropAreaHeight}px`;
          }
        }

        const taskbarOffsetLeft = taskBar.offsetLeft;
        const taskbarOffsetWith = taskBar.offsetWidth;

        let taskStartDate =
          that.dates[
          Math.round(taskbarOffsetLeft / timelineCellWidth) -
          (task.type === "milestone" ? 1 : 0)
            ];

        let taskEndDate =
          that.dates[
          Math.round(
            (taskbarOffsetLeft + taskbarOffsetWith) / timelineCellWidth
          ) - 1
            ];

        // if taskStartDate is less than the gantt range
        if (!taskStartDate) {
          const dateDiff = Math.round(taskbarOffsetLeft / timelineCellWidth);
          taskStartDate = that.add(new Date(that.dates[0]), dateDiff, "day");
        }

        // if taskEndDate is greater than the gantt range
        if (!taskEndDate) {
          const dateDiff =
            Math.round(
              (taskbarOffsetLeft + taskbarOffsetWith) /
              that.calculateGridWidth(task.start_date)
            ) - that.dates.length;

          taskEndDate = that.add(
            new Date(that.dates[that.dates.length - 1]),
            dateDiff,
            "day"
          );
        }

        // emmit event of moveTask
        that.dispatchEvent("onTaskDrag", {
          originalTask,
          task,
          mode: "move",
        });

        that.#updateTask(
          task,
          new Date(taskStartDate),
          new Date(taskEndDate),
          taskBar
        );
        return;
      }

      // drag taskbar left or right

      let size, left;

      if (type === "left") {
        size =
          startWidth -
          (e.x - startX) +
          (startRightPanelScrollLeft - rightPanelScroll.scrollLeft);
        left =
          startLeft +
          (e.x - startX) -
          (startRightPanelScrollLeft - rightPanelScroll.scrollLeft);
        if (size <= timelineCellWidth || left <= 0) {
          return;
        } else {
          taskBar.style.left = `${left}px`;
          taskBar.style.width = `${size}px`;
        }
      } else {
        size =
          startWidth +
          (e.x - startX) -
          (startRightPanelScrollLeft - rightPanelScroll.scrollLeft);

        // return if taskBar at start, end or width is 1 or less
        if (
          size <= timelineCellWidth ||
          taskBar.offsetLeft + size >= rightPanelScrollWidth
        ) {
          return;
        } else {
          taskBar.style.width = `${size}px`;
        }
      }

      const taskbarOffsetLeft = taskBar.offsetLeft;
      const taskbarOffsetWith = taskBar.offsetWidth;

      let taskStartDate =
        that.dates[Math.round((taskbarOffsetLeft + 1) / timelineCellWidth)];

      let taskEndDate =
        that.dates[
        Math.round(
          (taskbarOffsetLeft + taskbarOffsetWith) / timelineCellWidth
        ) - 1
          ];

      // emmit the dragTask event
      that.dispatchEvent("onTaskDrag", {
        originalTask,
        task,
        mode: "resize",
      });

      // if taskStartDate is less than the gantt range
      if (!taskStartDate) {
        const dateDiff =
          Math.round(taskbarOffsetLeft / timelineCellWidth) - that.dates.length;
        taskStartDate = that.add(
          new Date(that.dates[that.dates.length - 1]),
          dateDiff,
          "day"
        );
      }

      // if taskEndDate is greater than the gantt range
      if (!taskEndDate) {
        const dateDiff =
          Math.round(
            (taskbarOffsetLeft + taskbarOffsetWith) / timelineCellWidth
          ) - that.dates.length;
        taskEndDate = that.add(
          new Date(that.dates[that.dates.length - 1]),
          dateDiff,
          "day"
        );
      }

      if (task.type === "milestone") {
        taskEndDate = new Date(taskStartDate).setHours(23, 59, 59);
      }
      that.#updateTask(
        task,
        new Date(taskStartDate),
        new Date(taskEndDate),
        taskBar
      );
    }
  }

  /**
   * Method to update task position on the UI and update the task in data.
   * @param {*} task - task object which need to update.
   * @param {*} start - updated start date of the task.
   * @param {*} end updated end date of the task.
   * @param {*} target HTML element of the taskbar.
   * @param {*} eventType event type mousemove | mouseup
   */
  #updateTask(task, start, end, target, eventType = "mousemove") {
    const timelineCellWidth = this.calculateGridWidth(start, "day");
    const targetOffsetLeft = target.offsetLeft;
    const targetOffsetWidth = target.offsetWidth;
    start = new Date(start);
    end = new Date(end);

    // get the current start and end date of the taskbar
    let taskCurrentStart = new Date(
      this.dates[Math.floor(targetOffsetLeft / timelineCellWidth)]
    );

    let taskCurrentEnd = new Date(
      this.dates[
        Math.floor(
          (targetOffsetLeft + targetOffsetWidth - 1) / timelineCellWidth
        )
        ]
    );

    const startTimePixel = Math.round(targetOffsetLeft % timelineCellWidth);
    const startDateTime = this.getTimeByPx(startTimePixel, start);

    taskCurrentStart = new Date(taskCurrentStart);
    taskCurrentStart.setHours(startDateTime.hours, startDateTime.minutes);

    const endTimePixel = Math.round(
      (targetOffsetLeft + targetOffsetWidth - 1) % timelineCellWidth
    );

    const endDateTime = this.getTimeByPx(endTimePixel, end);

    taskCurrentEnd = new Date(taskCurrentEnd);
    taskCurrentEnd.setHours(endDateTime.hours, endDateTime.minutes);

    // update the task content innerHTML
    if (task.type === "milestone") {
      target.querySelector(".js-gantt-side-content").innerHTML =
        this.callTemplate("taskbar_text", start, end, task);
    } else {
      target.querySelector(".js-gantt-bar-task-content").innerHTML =
        this.callTemplate(
          "taskbar_text",
          taskCurrentStart,
          taskCurrentEnd,
          task
        );
    }

    if (this.options.zoomLevel === "hour") {
      const timelineCellStartWidth = this.calculateGridWidth(
        task.start_date,
        "day"
      );
      const timelineCellEndWidth = this.calculateGridWidth(
        task.end_date,
        "day"
      );

      const taskLeft = Math.floor(
        (targetOffsetLeft + 1) / timelineCellStartWidth
      );

      start = this.dates[taskLeft];
      const extraStartPX =
        targetOffsetLeft + 1 - taskLeft * timelineCellStartWidth;

      const taskStartTime = this.getTimeByPx(extraStartPX, new Date(start));
      start = new Date(new Date(start).setHours(taskStartTime.hours));

      const taskLeftAndWidth = Math.floor(
        (targetOffsetLeft + targetOffsetWidth) / timelineCellEndWidth
      );

      end = this.dates[taskLeftAndWidth];
      const extraEndPX =
        targetOffsetLeft +
        targetOffsetWidth +
        1 -
        taskLeftAndWidth * timelineCellEndWidth;

      const taskEndTime = this.getTimeByPx(extraEndPX, new Date(end));
      end = new Date(new Date(end).setHours(taskEndTime.hours - 1));
    }

    this.updateTaskDate(task, start, end);
    this.updateTaskDuration();

    if (target.classList.contains("js-gantt-bar-parent-task")) {
      return;
    }

    const that = this;
    const allParents = target.getAttribute("task-parent").split("");
    const taskData = [...this.options.data];
    const cellStartDate = this.options.startDate;

    updateAllParents(taskData, allParents, eventType);

    function updateAllParents(data, allParents, eventType) {
      let currentLevel = data;
      let currentParentSelector = allParents[0];

      for (let i = 0; i < allParents.length - 1; i++) {
        const currentTask = currentLevel[allParents[i]];
        currentLevel = currentTask.children;
        const currentParent = that.element.querySelector(
          `[task-parent="${currentParentSelector}"]`
        );

        currentParentSelector = `${currentParentSelector}${allParents[i + 1]}`;

        if (!currentLevel?.length || !currentParent) {
          continue;
        }

        let { start_date, end_date } = that.getLargeAndSmallDate(currentTask);
        const timelineCellStartWidth = that.calculateGridWidth(
          taskCurrentStart,
          "day"
        );
        const timelineCellEndWidth = that.calculateGridWidth(
          taskCurrentEnd,
          "day"
        );
        const currentParentLeft = currentParent.offsetLeft;

        const cellBefore = that.getDates(cellStartDate, new Date(start_date));

        if (currentParent) {
          // update parent inner html
          if (currentTask.type === "milestone") {
            const beforeDay = Math.floor(
              currentParentLeft / timelineCellStartWidth
            );

            if (currentParentLeft < 0) {
              start_date = that.add(
                new Date(that.options.startDate),
                beforeDay,
                "day"
              );
            } else {
              start_date = new Date(that.dates[beforeDay]);
            }

            end_date = new Date(new Date(start_date).setHours(23, 59, 59));

            currentParent.querySelector(".js-gantt-side-content").innerHTML =
              that.callTemplate(
                "taskbar_text",
                start_date,
                end_date,
                currentTask
              );
          } else {
            // find All childs of current parent
            const allChildsLeft = [];
            const allChildsLeftAndWidth = [];

            currentLevel.forEach((task) => {
              const childTaskBar = that.element.querySelector(
                `[js-gantt-taskbar-id="${task.id}"]`
              );
              if (childTaskBar) {
                const childTaskBarLeft =
                  childTaskBar.offsetLeft - (task.type === "milestone" ? 9 : 0);
                allChildsLeft.push(childTaskBarLeft);
                allChildsLeftAndWidth.push(
                  childTaskBarLeft + childTaskBar.offsetWidth
                );
              }
            });

            // if parent has startdate and end date
            if (
              that.hasProperty(currentTask, "start_date") ||
              that.hasProperty(currentTask, "end_date")
            ) {
              let cellBefore = that.getDates(
                cellStartDate,
                new Date(currentTask.start_date)
              );

              const taskDates = that.getDates(
                currentTask.start_date,
                new Date(currentTask.end_date)
              );

              if (cellBefore.length === 0) {
                cellBefore = that.getDates(
                  currentTask.start_date,
                  cellStartDate
                );
                cellBefore = -(cellBefore.length - 1);
              } else {
                cellBefore = cellBefore.length - 1;
              }

              const timelineCellWidth = that.calculateGridWidth(
                start_date,
                "day"
              );
              const taskbarLeft = cellBefore * timelineCellWidth;

              if (currentTask.start_date) {
                allChildsLeft.push(taskbarLeft);
              }

              if (currentTask.end_date) {
                allChildsLeftAndWidth.push(
                  taskbarLeft + taskDates.length * timelineCellWidth
                );
              }
            }

            let parentLeft = Math.min(...allChildsLeft);
            let parentWidth = Math.max(...allChildsLeftAndWidth) - parentLeft;

            if (eventType === "mouseup") {
              const gridWidth = that.calculateGridWidth(
                task.start_date,
                that.options.zoomLevel !== "hour" ? "day" : ""
              );
              parentLeft = Math.round(parentLeft / gridWidth) * gridWidth;
              parentWidth = Math.round(parentWidth / gridWidth) * gridWidth;
            }

            const beforeDay = Math.floor(parentLeft / timelineCellStartWidth);

            if (cellBefore.length === 0) {
              start_date = that.add(new Date(cellStartDate), beforeDay, "day");
            } else {
              start_date = new Date(that.dates[beforeDay]);
            }

            const afterDay = Math.floor(
              (parentLeft + parentWidth) / timelineCellEndWidth
            );

            if (afterDay > that.dates.length) {
              end_date = that.add(
                new Date(that.options.endDate),
                afterDay - that.dates.length,
                "day"
              );
            } else {
              const dateIndex = Math.floor(
                (parentLeft + parentWidth) / timelineCellEndWidth
              );

              end_date = new Date(that.dates[dateIndex - 1]);
            }

            currentParent.querySelector(
              ".js-gantt-bar-task-content"
            ).innerHTML = that.callTemplate(
              "taskbar_text",
              start_date,
              end_date,
              currentTask
            );

            if (
              parentWidth < timelineCellEndWidth &&
              task.type === "milestone"
            ) {
              parentLeft =
                that.posFromDate(
                  eventType === "mouseup" ? start : taskCurrentStart
                ) -
                (eventType !== "mouseup"
                  ? timelineCellEndWidth - targetOffsetWidth
                  : 0);
              parentWidth = timelineCellEndWidth;
            }

            currentParent.style.left = `${parentLeft}px`;
            currentParent.style.width = `${parentWidth}px`;
          }
        }
      }
    }
  }

  /**
   * Method to update task start_date and end_date
   * @param {*} task - task
   * @param {*} start - start_date
   * @param {*} end  - end_date
   */
  updateTaskDate(task, start, end) {
    task.start_date = start;
    task.end_date = end;
    this.originalData.findIndex((item) => {
      if (item.id == task.id) {
        item.start_date = start;
        item.end_date = end;
      }
    });
  }

  /**
   * Initializes the column sizes based on the given unit, step, and date.
   * @param {string} unit - The unit of time (e.g., "hour", "day", "week", "month", "quarter", "year").
   * @param {number} step - The step value for the unit.
   * @param {Date} date - The reference date.
   * @returns {{ startDate: Date, endDate: Date, dateCount: number }} - The start date, end date, and count of dates within the range.
   */
  initColSizes(unit, step, date) {
    let startDate, endDate;

    // Determine the start and end dates based on the unit
    switch (unit) {
      case "hour":
        // If unit is hour
        startDate = new Date(date);
        endDate = new Date(date);
        break;
      case "day":
        // If unit is day
        startDate = new Date(date);
        endDate = new Date(date);
        break;
      case "week":
        // If unit is week
        ({ startDate, endDate } = this.getWeekStartEndDate(date));
        break;
      case "month":
        // If unit is month
        ({ startDate, endDate } = this.getMonthStartEndDate(date));
        break;
      case "quarter":
        // If unit is quarter
        ({ startDate, endDate } = this.getQuarterStartEndDate(date));
        break;
      case "year": {
        // If unit is year
        const dateYear = new Date(date).getFullYear();
        startDate = new Date(dateYear, 0, 1);
        endDate = new Date(dateYear, 11, 31);
        break;
      }
      default:
        // Handle invalid unit
        this.toastr("Error", `Invalid scale unit: ${unit}`, "error");
        return;
    }

    if (step > 1) {
      endDate = this.add(endDate, step - 1, unit);
    }

    const rangeStart = this.stripTime(this.options.startDate).getTime();
    const rangeEnd = this.stripTime(this.options.endDate).getTime();

    const dateCount =
      this.getDates(startDate, endDate).filter((date) => {
        const dateToCheck = new Date(date).setHours(0, 0, 0, 0);
        return dateToCheck >= rangeStart && dateToCheck <= rangeEnd;
      })?.length || 0;

    return {
      startDate,
      endDate,
      dateCount,
    };
  }

  /**
   * Get the start and end dates of the month for a given date.
   * @param {Date|string} date - The date for which to find the month's start and end dates.
   * @returns {{startDate: Date, endDate: Date}} - The start and end dates of the month.
   */
  getMonthStartEndDate(date) {
    date = new Date(date); // date for which we find month start and month end
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Add 1 because getMonth() returns 0-indexed months
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return {
      startDate,
      endDate,
    };
  }

  /**
   * Get the start and end dates of the quarter for a given date.
   * @param {Date|string} dateString - The date for which to find the quarter's start and end dates.
   * @returns {{startDate: Date, endDate: Date}} - The start and end dates of the quarter.
   */
  getQuarterStartEndDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    const quarterStartMonth = Math.floor(month / 3) * 3;
    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterStartMonth + 3, 0);

    return {
      startDate,
      endDate,
    };
  }

  /**
   * Calculates the timeline scale height.
   * @param { string } type - The type of scale ("header" or "scroll" or "body").
   * @param { number } [i=0] - The index for individual scale heights.
   * @returns { string | number } - The calculated height as a string with 'px' for header, or a number for scroll.
   */
  calculateScaleHeight(type, i = 0) {
    const { scales } = this.options;
    const scaleHeight = this.options.scale_height;

    if (type === "header" || type === "scroll") {
      let height;

      if (Array.isArray(scaleHeight)) {
        height = scaleHeight.reduce(
          (totalHeight, height) => totalHeight + height,
          0
        );

        if (scales.length !== scaleHeight.length) {
          height += (scales.length - scaleHeight.length) * 30;
        }
      } else {
        height = scales.length * scaleHeight;
      }
      return type === "scroll" ? height : `${height}px`;
    } else {
      if (Array.isArray(scaleHeight)) {
        return `${i > 0 ? scaleHeight[i] || 30 : scaleHeight[i] - 1 || 29}px`;
      } else {
        return `${i > 0 ? scaleHeight : scaleHeight - 1}px`;
      }
    }
  }

  /**
   * Method to get the timeline cell width based on date and zoom level.
   * @param {Date} date - date of the cell.
   * @param {string} levelType - zoom level of the cell.
   * @returns {Number} returns the timeline single grid cell width.
   */
  calculateGridWidth(date = new Date(0), levelType = this.options.zoomLevel) {
    const sidebar = document.getElementById("js-gantt-grid-left-data");
    const totalWidth = this.options.columns.reduce(
      (totalWidth, col) => totalWidth + col.width,
      0
    );

    let sidebarWidth = 0;
    if (sidebar) {
      const headCell = this.element.querySelectorAll(".head-cell");
      if (headCell.length !== this.options.columns.length) {
        sidebarWidth = totalWidth;
      } else {
        sidebarWidth = sidebar.offsetWidth;
      }
    } else {
      sidebarWidth = totalWidth;
    }

    let elementWidth = this.element.scrollWidth - sidebarWidth;

    if (this.options.rightGrid) {
      const totalWidth = this.options.rightGrid.reduce(
        (totalWidth, col) => totalWidth + col.width,
        0
      );
      elementWidth -= totalWidth;
    }

    if (
      sidebar?.offsetHeight < sidebar?.scrollHeight ||
      this.#ganttHeight > this.element.offsetHeight
    ) {
      elementWidth -= 22;
    } else {
      elementWidth -= sidebar?.offsetHeight ? 2 : 0;
    }

    let minWidth = this.options.minColWidth;
    const colCount = this.dates.length;

    const date0 = new Date(0);

    const level = date !== date0 ? this.options.zoomLevel : "day";

    date = new Date(date);

    switch (level) {
      case "hour":
        minWidth = levelType === "day" ? minWidth : minWidth / 24;
        break;
      case "week":
        minWidth = minWidth / 7;
        break;
      case "month":
        minWidth = minWidth / this.getDaysInMonth(date);
        break;
      case "quarter":
        minWidth = minWidth / this.getDaysInQuarter(date);
        break;
      case "year":
        minWidth = minWidth / 365;
        break;
      default:
        minWidth;
        break;
    }
    const gridWidth = Math.max(
      elementWidth /
      (level === "hour" && levelType !== "day" ? colCount * 24 : colCount),
      minWidth
    );
    return gridWidth;
  }

  calculateTimeLineWidth(type, levelType = this.options.zoomLevel) {
    let totalWidth = 0;

    if (type == "updated") {
      const isZoomLevelDay =
        this.options.zoomLevel === "day" || levelType === "day";

      if (!isZoomLevelDay) {
        let cellEndDate = new Date(0);
        const { zoomLevel } = this.options;

        for (const date of this.dates) {
          if (cellEndDate.getTime() >= date) {
            continue;
          }
          const { endDate, dateCount } = this.initColSizes(zoomLevel, 1, date);

          const cellWidth = this.calculateGridWidth(date);
          totalWidth += cellWidth * dateCount;
          cellEndDate = endDate;
        }
      } else {
        totalWidth =
          this.calculateGridWidth(new Date(0), levelType) * this.dates.length;
      }
    } else {
      const timeLineRow = this.element.querySelector(".js-gantt-task-row");
      const timeLineCell = timeLineRow.querySelectorAll(".js-gantt-task-cell");
      totalWidth = Array.from(timeLineCell).reduce(
        (totalWidth, cell) => totalWidth + cell.offsetWidth,
        0
      );
    }
    return totalWidth;
  }

  // create lightbox
  createLightbox() {
    if (this.lightbox) {
      return;
    }

    // Using imported createElement utility
    const lightbox = createElement("div", {
      id: "js-gantt-lightbox",
      classes: ["js-gantt-lightbox"],
      attributes: { role: "dialog" },
      styles: { display: "none" },
    });

    const lightboxBackdrop = createElement("div", {
      id: "js-gantt-lightbox-backdrop",
      classes: ["js-gantt-lightbox-backdrop"],
      styles: { display: "none" },
    });

    this.lightbox = {
      lightbox,
      lightboxBackdrop,
    };

    document.body.append(lightboxBackdrop);
    document.body.append(lightbox);
  }

  // show lightbox
  showLightBox(task) {
    if (!this.lightbox) {
      return;
    }

    const { lightbox, lightboxBackdrop } = this.lightbox;

    lightbox.innerHTML =
      this.callTemplate("showLightBox", task) ||
      `<div class="js-gantt-task-title">
    <span>${task.text}</span>
  </div>
  <div><p>${this.options.currentLanguage.label.description}</p></div>
  <div>
  <textarea rows="4" id="lightbox-text-area" placeholder="Description">${task.text}</textarea>
  </div>
  <div class='lightbox-footer'>
  <button role="save">${this.options.currentLanguage.buttons.save}</button>
  <button role="cancel">${this.options.currentLanguage.buttons.cancel}</button>
  <button role="delete">${this.options.currentLanguage.buttons.delete}</button>
  </div>
  `;

    setStyles(lightbox, { display: "block" });
    setStyles(lightboxBackdrop, { display: "block" });

    if (
      !this.templates?.showLightBox &&
      !isFunction(this.templates?.showLightBox)
    ) {
      const that = this;

      // hide lightbox
      const cancelbtn = querySelector("[role=cancel]", document);

      cancelbtn.addEventListener("click", handleCancelClick);

      function handleCancelClick() {
        that.hideLightbox();
      }

      // delete task
      const deletebtn = querySelector("[role=delete]", document);

      deletebtn.addEventListener("click", handleDeleteClick);

      function handleDeleteClick() {
        that.deleteTask(task.id);
      }

      // update task
      const savebtn = querySelector("[role=save]", document);
      const textarea = document.querySelector("#lightbox-text-area");

      savebtn.addEventListener("click", handleSaveClick);

      function handleSaveClick() {
        task.text = textarea.value;
        that.updateTaskData(task);
      }
    }
  }

  // hide lightbox
  hideLightbox() {
    if (!this.lightbox) {
      return;
    }
    const { lightbox, lightboxBackdrop } = this.lightbox;
    const backdrop = lightboxBackdrop;
    lightbox.style.display = "none";
    backdrop.style.display = "none";
  }

  /**
   * Adds a new task to the Gantt chart
   *
   * @param {Object} task - Task object to add
   * @param {string|number} task.id - Unique identifier for the task (must be unique)
   * @param {string} task.name - Display name of the task
   * @param {Date|string} task.start_date - Task start date (YYYY-MM-DD format)
   * @param {number} task.duration - Task duration in days
   * @param {number} [task.progress=0] - Task progress percentage (0-100)
   * @param {string|number} [task.parent] - Parent task ID for hierarchical tasks
   * @param {Array<Object>} [task.children] - Child tasks
   * @param {string} [task.type] - Task type (e.g., 'task', 'milestone', 'project')
   *
   * @returns {void}
   *
   * @throws {Error} If task ID equals parent ID (circular reference)
   *
   * @example
   * gantt.addTask({
   *   id: 1,
   *   name: 'Project Setup',
   *   start_date: '2024-01-01',
   *   duration: 5,
   *   progress: 50
   * });
   */
  addTask(task) {
    if (task.id == task.parent) {
      this.toastr("Error", "task id and task parent can not be same", "error");
      return;
    }

    // Use TaskManager to add task if available
    if (this.#taskManager) {
      try {
        this.#taskManager.addTask(task);
      } catch (e) {
        this.toastr("Error", e.message, "error");
        return;
      }
    }

    this.originalData.unshift(task);
    this.eachTask((item) => {
      if (item.id == task.parent) {
        if (!item.children) {
          item.children = [];
        }

        item.children.unshift(task);
      }
    });

    // Sync TaskManager opened tasks
    if (!this.isTaskOpened(task.parent)) {
      this.addTaskToOpenedList(task.parent);
      if (this.#taskManager) {
        this.#taskManager.expand(task.parent);
      }
    }

    this.addTaskToOpenedList(task.id);
    if (this.#taskManager) {
      this.#taskManager.expand(task.id);
    }

    this.hideLightbox();
    this.dispatchEvent("onTaskAdd", { task });
  }

  /**
   * Deletes a task from the Gantt chart
   *
   * @param {number|string} id - The ID of the task to delete
   * @returns {void}
   *
   * @throws {Error} If task cannot be found
   *
   * @example
   * gantt.deleteTask(1);
   */
  deleteTask(id) {
    // Find the index of the task in originalData
    const index = this.originalData.findIndex((task) => task.id == id);
    // If task is found
    if (index !== -1) {
      const task = this.getTask(id);

      // Use TaskManager to delete task
      if (this.#taskManager) {
        this.#taskManager.deleteTask(id);
      }

      this.originalData.splice(index, 1);
      this.render();
      this.hideLightbox();
      this.dispatchEvent("onTaskDelete", { task });
    }
  }

  /**
   * Updates an existing task in the Gantt chart
   *
   * @param {Object} task - Updated task object
   * @param {string|number} task.id - The ID of the task to update (must exist)
   * @param {string} [task.name] - Updated task name
   * @param {Date|string} [task.start_date] - Updated start date
   * @param {number} [task.duration] - Updated duration in days
   * @param {number} [task.progress] - Updated progress percentage
   * @param {string} [task.type] - Updated task type
   *
   * @returns {void}
   *
   * @throws {Error} If task with specified ID is not found
   *
   * @example
   * gantt.updateTaskData({
   *   id: 1,
   *   name: 'Updated Task',
   *   progress: 75
   * });
   */
  updateTaskData(task) {
    // Use TaskManager to update task if available
    if (this.#taskManager) {
      this.#taskManager.updateTask(task);
    }

    const updatedTaskIndex = this.originalData.findIndex(
      (item) => item.id == task.id
    );

    if (updatedTaskIndex !== -1) {
      this.originalData[updatedTaskIndex] = {
        ...this.originalData[updatedTaskIndex],
        ...task,
      };

      this.eachTask((item, parentTask, index) => {
        if (item.id === task.id) {
          parentTask[index] = this.originalData[updatedTaskIndex];
        }
      });

      this.updateTaskDuration();
      this.hideLightbox();

      this.dispatchEvent("onAfterTaskUpdate", { task });
    }
  }

  /**
   * Exports the Gantt chart as a PNG image
   *
   * @param {string} [name='javascriptgantt'] - The name of the exported file
   * @param {Object} [styleSheet] - Optional custom stylesheet for the export
   * @returns {void}
   *
   * @example
   * gantt.exportToPNG('my-gantt-chart');
   */
  exportToPNG(name = "javascriptgantt", styleSheet) {
    this.getFile(name, "png", styleSheet);
  }

  /**
   * Exports the Gantt chart as a PDF document
   *
   * @param {string} [name='javascriptgantt'] - The name of the exported file
   * @param {Object} [styleSheet] - Optional custom stylesheet for the export
   * @returns {void}
   *
   * @example
   * gantt.exportToPDF('my-gantt-chart');
   */
  exportToPDF(name = "javascriptgantt", styleSheet) {
    this.getFile(name, "pdf", styleSheet);
  }

  /**
   * Method to export Gantt as Excel.
   * @param { string } name - Name of the exported excel file.
   */
  exportToExcel(name = "javascriptgantt") {
    let csv = "";
    const regexIgnorePattern =
      /<[^>]+?\sjs-gantt-ignore=(["'])(true)\1[^>]*>.*?<\/[^>]+?>/g;

    // Function to escape quotes and commas in the CSV content
    function escapeCSV(value) {
      if (typeof value === "string") {
        value = value.replace(regexIgnorePattern, "").replace(/<[^>]*>/g, "");
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      return value;
    }

    // Create the header row
    let headerRow = this.options.columns
      .map((col) => escapeCSV(col.label))
      .join(",");

    const right = this.options.rightGrid;
    if (right) {
      headerRow += `,${right.map((col) => escapeCSV(col.label)).join(",")}`;
    }

    csv += `${headerRow}\n`;

    // Call the recursive function to convert data to CSV
    csv += convertToCSV(this.options.data, this.options.columns, right);

    // Recursive function to convert data to CSV
    function convertToCSV(array, columns, right) {
      let csvData = "";

      array.forEach((obj) => {
        const rowData = columns.map((col) => escapeCSV(col.template(obj)));
        if (right) {
          rowData.push(...right.map((col) => escapeCSV(col.template(obj))));
        }
        csvData += `${rowData.join(",")}\n`;

        if (obj.children && obj.children.length > 0) {
          csvData += convertToCSV(obj.children, columns, right);
        }
      });

      return csvData;
    }

    // Create a download link - using imported createElement
    const link = createElement("a", {
      attributes: {
        href: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
        download: `${name}.csv`,
      },
    });
    // Programmatically trigger the download
    link.click();
    link.remove();
  }

  // Method for calling api
  getFile(filename = "javascriptgantt", type, styleSheet) {
    const apiUrl = this.options.exportApi;

    if (!this.options.exportApi) {
      this.toastr("Add export url", "Please add an export url!!", "error");
      return;
    }

    const postData = {
      styles: styleSheet,
      content: this.element.outerHTML,
      fileType: type,
      zoom: this.options.zoomLevel,
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    };
    this.showLoader();

    getFileApiCall();

    const that = this;

    async function getFileApiCall() {
      await fetch(apiUrl, requestOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          const blob = new Blob([new Uint8Array(data.data.data)], {
            type: "application/pdf",
          });
          that.saveAs(filename, blob, type);
          that.hideLoader();
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          that.toastr("Export Error", error, "error");
          that.hideLoader();
        });
    }
  }

  // Method for saving file
  saveAs(fileName, blob, type) {
    const url = URL.createObjectURL(blob);
    // Using imported createElement utility
    const link = createElement("a", {
      attributes: {
        href: url,
        download: `${fileName}.${type}`,
      },
    });
    link.click();
    URL.revokeObjectURL(url);
  }

  // Method to create sidebar child rows
  createSidebarChild(
    taskData,
    options,
    leftDataContainer,
    nestedLevel,
    parentIdString,
    isRight,
    isOpened
  ) {
    // loop through all the children
    for (let l = 0; l < taskData.length; l++) {
      const task = taskData[l];
      const taskParents = `${parentIdString}${l}`;

      if (!this.isTaskNotInSearchedData(task.id)) {
        if (this.#searchedData) {
          this.addTaskToOpenedList(task.id.id);
        }

        // Using imported createElement utility
        const dataItem = createElement("div", {
          classes: [
            "js-gantt-row-item",
            "js-gantt-child-row",
            `js-gantt-child-${task.parent}`,
            !isOpened ? "js-gantt-d-none" : "js-gantt-d-flex",
            this.options.selectedRow === `${task.id}`
              ? "js-gantt-selected"
              : "js-gantt-row-item",
          ],
          attributes: {
            "js-gantt-data-task-id": `${taskParents}`,
            "js-gantt-task-id": task.id,
          },
          styles: {
            height: `${options.row_height}px`,
            lineHeight: `${options.row_height}px`,
          },
        });

        //add custom classes from user
        const { start_date, end_date } = this.getLargeAndSmallDate(task);
        this.addClassesFromFunction(
          this.templates.grid_row_class,
          dataItem,
          start_date,
          end_date,
          task
        );

        const that = this;

        // handle double click event
        dataItem.addEventListener("dblclick", handleDblClick);

        function handleDblClick(e) {
          if (hasClass(e.target, "js-gantt-tree-icon")) {
            return;
          }

          // custom event handler
          that.dispatchEvent("onBeforeTaskDblClick", { task });

          // if onBeforeTaskDblClick return false then do not drag the task
          if (that.eventValue === false) {
            that.eventValue = true;
            return;
          }

          that.dispatchEvent("onTaskDblClick", { task });

          that.showLightBox(task);
        }

        // Handle mouseover event
        dataItem.addEventListener("mouseover", () =>
          this.updateTooltipBody(task)
        );

        // Handle mouseleave event
        dataItem.addEventListener("mouseleave", this.hideTooltip.bind(this));

        this.addClickListener(dataItem, (e) => {
          if (hasClass(e.target, "js-gantt-tree-icon")) {
            return;
          }
          that.selectTask(task);
        });

        // loop through all the columns
        for (let k = 0; k < options.columns.length; k++) {
          const column = this.options.columns[k];

          // Using imported createElement utility
          const cell = createElement("div", {
            classes: ["js-gantt-cell"],
            attributes: isRight
              ? { "data-column-index": `r-${k}` }
              : { "data-column-index": k },
            styles: {
              width: `${column.width || 80}px`,
              ...(column.align && { textAlign: column.align, justifyContent: column.align }),
            },
          });

          //add custom class from user
          this.addClassesFromFunction(
            this.templates.grid_cell_class,
            cell,
            column,
            task
          );

          // Using imported createElement utility
          const jsGanttBlank = createElement("div", {
            classes: ["js-gantt-blank"],
            html: this.callTemplate("grid_blank", task),
          });

          // content - using imported createElement
          const content = createElement("div", {
            classes: [
              "js-gantt-cell-data",
              "js-gantt-child-cell",
              k == 0 ? "js-gantt-d-block" : "js-gantt-child-data",
            ],
            html: column.template(task) || task[column.name] || " ",
          });

          // update content innerHTML on after task update
          this.attachEvent("onAfterTaskUpdate", () => {
            content.innerHTML =
              column.template(task) || task[column.name] || " ";
          });

          // update content innerHTML on after progress drag
          this.attachEvent("onAfterProgressDrag", () => {
            content.innerHTML =
              column.template(task) || task[column.name] || " ";
          });

          // update content innerHTML on task drag
          this.attachEvent("onTaskDrag", () => {
            content.innerHTML =
              column.template(task) || task[column.name] || " ";
          });

          // update content innerHTML on after task drag
          this.attachEvent("onAfterTaskDrag", () => {
            content.innerHTML =
              column.template(task) || task[column.name] || " ";
          });

          if (column.tree) {
            // file icon - using imported createElement
            const file = createElement("div", {
              classes: ["js-gantt-file-icon"],
              html: this.callTemplate("grid_file", task),
            });

            //add child indentation
            for (let n = 0; n < nestedLevel; n++) {
              const indent = createElement("div", {
                classes: ["js-gantt-indent"],
              });
              cell.append(indent);
            }
            addClass(cell, "js-gantt-d-flex");

            if (task.children && task.children.length > 0) {
              // tree icon - using imported createElement
              const treeIcon = createElement("div", {
                classes: [
                  "js-gantt-tree-icon",
                  !this.options.openedTasks.includes(task.id)
                    ? "js-gantt-tree-close"
                    : "js-gantt-tree-open",
                ],
              });
              cell.append(treeIcon);

              this.addClickListener(treeIcon, () => {
                const isTaskCollapse = !this.isTaskOpened(task.id);

                if (isTaskCollapse) {
                  this.addTaskToOpenedList(task.id);
                } else {
                  this.removeTaskFromOpenedList(task.id);
                }

                this.setCollapseAll(
                  task.children,
                  task.id,
                  isTaskCollapse ? "open" : "collapse"
                );

                this.createTaskBars();

                // Using imported class utilities
                if (hasClass(treeIcon, "js-gantt-tree-close")) {
                  removeClass(treeIcon, "js-gantt-tree-close");
                  addClass(treeIcon, "js-gantt-tree-open");
                } else {
                  removeClass(treeIcon, "js-gantt-tree-open");
                  addClass(treeIcon, "js-gantt-tree-close");
                }

                const jsGanttLayout = querySelector("#js-gantt-layout", this.element);
                this.createScrollbar(jsGanttLayout);

                // custom event of toggle tree
                this.dispatchEvent("onTaskToggle", {
                  task,
                  isTaskOpened: isTaskCollapse,
                });
              });
            } else {
              cell.append(jsGanttBlank);
            }
            cell.append(file);
          }
          cell.append(content);
          dataItem.append(cell);
          if (column?.editor) {
            cell.addEventListener("click", (e) => {
              if (hasClass(e.target, "js-gantt-tree-icon")) {
                return;
              }
              this.addInlineEditor(
                task,
                column.editor,
                cell,
                leftDataContainer
              );
            });
          }
        }

        leftDataContainer.append(dataItem);
      }

      this.createSidebarChild(
        task.children,
        options,
        leftDataContainer,
        nestedLevel + 1,
        taskParents,
        isRight,
        isOpened ? this.isTaskOpened(task.id) : isOpened
      );
    }
  }

  createTimelineChildBody(
    taskData,
    jsGanttTaskData,
    parentIdString,
    isOpened,
    timelineRowTemplate
  ) {
    const { options } = this;

    // loop through all the children
    for (let l = 0; l < taskData.length; l++) {
      const task = taskData[l];
      const taskParents = `${parentIdString}${l}`;

      if (!this.isTaskNotInSearchedData(task.id)) {
        const timelineRow = timelineRowTemplate.cloneNode(true);
        const isRowSelected = options.selectedRow === `${task.id}`;
        const isCollapsed = !this.isTaskOpened(task.parent);

        // Array to hold the classes
        const classes = ["js-gantt-child-row", `js-gantt-child-${task.parent}`];

        // Conditionally add classes based on `isCollapsed` and `isOpened`
        if (isCollapsed || !isOpened) {
          classes.push("js-gantt-d-none");
        }

        // Conditionally add the selected class
        if (isRowSelected) {
          classes.push("js-gantt-selected");
        }

        timelineRow.classList.add(...classes);

        //add custom classes from user
        const { start_date, end_date } = this.getLargeAndSmallDate(task);
        this.addClassesFromFunction(
          this.templates.task_row_class,
          timelineRow,
          start_date,
          end_date,
          task
        );

        timelineRow.setAttribute("js-gantt-data-task-id", taskParents);
        timelineRow.setAttribute("js-gantt-task-id", task.id);

        // handle cell click event
        this.addClickListener(timelineRow, (e) => {
          if (e.target.classList.contains("js-gantt-task-cell")) {
            this.dispatchEvent("onCellClick", {
              task,
              cellDate: e.target.getAttribute("js-gantt-cell-date"),
            });
          }
        });

        jsGanttTaskData.append(timelineRow);
      }

      // if children exist
      if (task?.children?.length) {
        this.createTimelineChildBody(
          task.children,
          jsGanttTaskData,
          taskParents,
          isOpened ? this.isTaskOpened(task.id) : isOpened,
          timelineRowTemplate
        );
      }
    }
  }

  createChildTaskBars(taskData, rowCount, jsGanttBarsArea, taskParentString) {
    const cellStartDate = this.options.startDate;
    const barTaskHeight = Math.floor((this.options.row_height * 80) / 100);
    // loop through all children
    for (let k = 0; k < taskData.length; k++) {
      const task = taskData[k];
      const taskParents = `${taskParentString}${k}`;

      if (!this.isTaskNotInSearchedData(task.id)) {
        let { start_date } = task;
        let end_date = task.end_date || task.start_date;

        if (task?.children?.length) {
          ({ start_date, end_date } = this.getLargeAndSmallDate(task));
        }

        let cellBefore = this.getDates(
          cellStartDate,
          task.type === "milestone" ? task.start_date : start_date
        );

        if (cellBefore.length === 0) {
          cellBefore = this.getDates(start_date, cellStartDate);
          cellBefore = -(cellBefore.length - 1);
        } else {
          cellBefore = cellBefore.length - 1;
        }

        // Build task bar classes
        const taskBarClasses = ["js-gantt-bar-task"];
        if (task.type === "milestone") {
          taskBarClasses.push("js-gantt-bar-milestone");
          if (this.options.selectedTask === `${task.id}`) {
            taskBarClasses.push("js-gantt-selected-task-bar");
          }
        } else {
          if (this.options.selectedTask === `${task.id}`) {
            taskBarClasses.push("js-gantt-selected-task-bar");
          }
        }

        let taskLeft = cellBefore * this.calculateGridWidth(start_date, "day");
        const hourLeft = this.getPxByTime(start_date, "left");
        taskLeft += hourLeft;

        const taskTop = rowCount * this.options.row_height + Math.floor((this.options.row_height * 10) / 100);

        // Build task bar styles
        const taskBarStyles = {
          left: `${taskLeft}px`,
          top: `${taskTop}px`,
          height: `${barTaskHeight}px`,
          lineHeight: `${barTaskHeight}px`,
        };

        if (task.type === "milestone") {
          taskBarStyles.width = `${barTaskHeight}px`;
          taskBarStyles.left = `${(cellBefore + 1) * this.calculateGridWidth(start_date, "day")}px`;
        }

        // Using imported createElement utility
        const jsGanttBarTask = createElement("div", {
          classes: taskBarClasses,
          styles: taskBarStyles,
          attributes: {
            "task-parent": taskParents,
            "data-task-pos": k,
            "js-gantt-taskbar-id": task.id,
          },
        });

        // Apply custom task color
        if (task.taskColor && task.type !== "milestone") {
          jsGanttBarTask.style.setProperty(
            "background-color",
            this.changeOpacity(task.taskColor),
            "important"
          );
          jsGanttBarTask.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        //add custom class from user
        this.addClassesFromFunction(
          this.templates.task_class,
          jsGanttBarTask,
          start_date,
          end_date,
          task
        );

        // Using imported createElement utility
        const jsGanttBarTaskContent = createElement("div", {
          classes: ["js-gantt-bar-task-content", "child-task-bar-content"],
        });

        if (task.type === "milestone" && task.taskColor) {
          jsGanttBarTaskContent.style.setProperty(
            "background-color",
            task.taskColor,
            "important"
          );

          jsGanttBarTaskContent.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        const that = this;

        // handle double click event
        jsGanttBarTask.addEventListener("dblclick", handleDblClick);

        function handleDblClick() {
          // custom event handler
          that.dispatchEvent("onBeforeTaskDblClick", { task });

          // if onBeforeTaskDblClick return false then end here
          if (that.eventValue === false) {
            that.eventValue = true;
            return;
          }

          that.dispatchEvent("onTaskDblClick", { task });

          that.showLightBox(task);
        }

        const { userAgent } = navigator;

        // Handle mouseover event
        jsGanttBarTask.addEventListener("mouseover", handleMouseOver);

        function handleMouseOver() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.add("hovered");
          }

          that.updateTooltipBody(task);
        }

        // Handle mouseleave event
        jsGanttBarTask.addEventListener("mouseleave", handleMouseLeave);

        function handleMouseLeave() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.remove("hovered");
          }

          that.hideTooltip();
        }

        if (
          this.callTemplate("task_drag", "resize", task) &&
          task.type !== "milestone"
        ) {
          // Using imported createElement utility
          const jsGanttTaskDragLeft = createElement("div", {
            classes: ["js-gantt-task-drag-left"],
          });
          const jsGanttTaskDragRight = createElement("div", {
            classes: ["js-gantt-task-drag-right"],
          });

          jsGanttBarTask.append(jsGanttTaskDragLeft, jsGanttTaskDragRight);
          this.resizeTaskBars(
            jsGanttTaskDragLeft,
            jsGanttBarTask,
            "left",
            task
          );
          this.resizeTaskBars(
            jsGanttTaskDragRight,
            jsGanttBarTask,
            "right",
            task
          );
        }

        if (this.callTemplate("task_drag", "move", task)) {
          this.resizeTaskBars(
            jsGanttBarTaskContent,
            jsGanttBarTask,
            "move",
            task
          );
        }

        // link control pointers - using imported isFunction
        const isAddLinks = isFunction(this.options.addLinks)
          ? this.options.addLinks(task)
          : this.options.addLinks;

        if (isAddLinks === true) {
          // Using imported createElement utility
          const leftLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-left-point"],
          });
          const leftPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          const rightLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-right-point"],
          });
          const rightPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          leftLinkPoint.append(leftPoint);
          rightLinkPoint.append(rightPoint);
          jsGanttBarTask.append(leftLinkPoint, rightLinkPoint);
          this.createNewLink(rightPoint, jsGanttBarTask, task.id, "right");
          this.createNewLink(leftPoint, jsGanttBarTask, task.id, "left");
        }

        let taskProgress;
        // Using imported isFunction
        const isTaskProgress = isFunction(this.options.taskProgress)
          ? this.options.taskProgress(task)
          : this.options.taskProgress;
        if (isTaskProgress === true && task.type !== "milestone") {
          const progressPer = task.progress || 0;
          const progressWidth = progressPer > 100 ? 100 : progressPer;

          // Using imported createElement utility
          const taskProgressContainer = createElement("div", {
            classes: ["js-gantt-task-progress-wrapper"],
          });
          taskProgress = createElement("div", {
            classes: ["js-gantt-task-progress"],
            styles: { width: `${progressWidth}%` },
          });

          if (task.taskColor) {
            taskProgress.style.setProperty(
              "background-color",
              task.taskColor,
              "important"
            );
          }

          taskProgressContainer.append(taskProgress);

          const taskProgressDrag = createElement("div", {
            classes: ["js-gantt-task-progress-drag"],
            styles: { left: `${progressWidth}%` },
          });

          // update the task progress onAfterTaskUpdate
          this.attachEvent("onAfterTaskUpdate", () => {
            const progress = progressPer > 100 ? 100 : task.progress || 0;
            setStyles(taskProgress, { width: `${progress}%` });
            setStyles(taskProgressDrag, { left: `${progress}%` });
          });

          jsGanttBarTask.append(taskProgressContainer, taskProgressDrag);
          this.dragTaskProgress(
            taskProgressDrag,
            taskProgress,
            jsGanttBarTask,
            task
          );
        }

        //add custom task color picker - using imported isFunction
        const isCustomColor = isFunction(this.options.taskColor)
          ? this.options.taskColor(task)
          : this.options.taskColor;

        if (isCustomColor) {
          // Using imported createElement utility
          const colorPicker = createElement("div", {
            classes: ["js-gantt-task-color-picker"],
          });
          const colorInput = createElement("input", {
            attributes: { type: "color" },
          });

          setTimeout(() => {
            let backgroundColor = task?.taskColor;
            if (!task?.taskColor) {
              // Get the computed style of the element
              const backgroundElement =
                task.type === "milestone"
                  ? jsGanttBarTaskContent
                  : jsGanttBarTask;
              const jsGanttBarTaskStyle =
                window.getComputedStyle(backgroundElement);
              // Get the background-color property value
              backgroundColor =
                jsGanttBarTaskStyle.getPropertyValue("background-color");
            }
            colorInput.value =
              task?.taskColor || this.rgbaToHex(backgroundColor);
          }, 0);

          colorPicker.append(colorInput);
          jsGanttBarTask.append(colorPicker);

          this.changeTaskbarColor(
            jsGanttBarTask,
            colorInput,
            taskProgress,
            jsGanttBarTaskContent,
            task
          );
        }

        const taskDates = this.getDates(start_date, end_date);

        if (task.type !== "milestone") {
          let taskWidth =
            taskDates.length * this.calculateGridWidth(end_date, "day");

          if (taskWidth === 0 || !taskWidth) {
            jsGanttBarTask.classList.add("js-gantt-d-none");
          }

          let hourWidth = this.getPxByTime(end_date, "width");
          const hourLeft = this.getPxByTime(start_date, "left");
          hourWidth += hourLeft;
          taskWidth -= hourWidth;

          jsGanttBarTask.style.width = `${taskWidth}px`;
        }
        start_date = new Date(start_date).setHours(0, 0, 0);
        end_date = new Date(end_date).setHours(0, 0, 0);
        let sideContent;
        const innerHTML = this.callTemplate(
          "taskbar_text",
          new Date(start_date),
          new Date(end_date),
          task
        );
        if (task.type === "milestone") {
          // Using imported createElement utility
          sideContent = createElement("div", {
            classes: ["js-gantt-side-content"],
            html: innerHTML,
          });
          jsGanttBarTask.append(sideContent);
        } else {
          jsGanttBarTaskContent.innerHTML = innerHTML;
        }

        this.attachEvent("onAfterTaskUpdate", () => {
          const innerHTML = this.callTemplate(
            "taskbar_text",
            new Date(start_date),
            new Date(end_date),
            task
          );
          if (task.type === "milestone") {
            sideContent.innerHTML = innerHTML;
          } else {
            jsGanttBarTaskContent.innerHTML = innerHTML;
          }
        });

        jsGanttBarTask.append(jsGanttBarTaskContent);

        jsGanttBarsArea.append(jsGanttBarTask);

        rowCount += 1;
      }

      if (task.children && this.isTaskOpened(task.id)) {
        rowCount = this.createChildTaskBars(
          task.children,
          rowCount,
          jsGanttBarsArea,
          taskParents
        );
      }
    }
    return rowCount;
  }

  /**
   *
   * @param {Array} data - tasks data to be expanded.
   * @param {Array} openedTasks - array of opened tasks.
   * @returns {Array} Array of updated opened tasks.
   */
  setAllExpand(data, openedTasks) {
    for (const item of data) {
      openedTasks.push(item.id);
      if (item?.children?.length) {
        this.setAllExpand(item.children, openedTasks);
      }
    }
    return openedTasks;
  }

  /**
   *
   * @param {Array} data - tasks children data to be collapsed.
   * @param {number | string} parentId - task id which need to be collapsed.
   * @param {string} type - open | collapse.
   */
  setCollapseAll(data, parentId, type) {
    if (!data) {
      return;
    }

    data.forEach((child) => {
      if (child.children && child?.children?.length) {
        const childType =
          this.isTaskOpened(parentId) && type === "open" ? "open" : "collapse";
        this.setCollapseAll(child.children, child.id, childType);
      }
    });

    const childrenSelector =
      type === "collapse"
        ? `.js-gantt-child-${parentId}:not(.js-gantt-d-none)`
        : `.js-gantt-child-${parentId}.js-gantt-d-none`;

    const children = this.element.querySelectorAll(childrenSelector);

    Array.from(children).forEach((child) => {
      if (type === "collapse") {
        child.classList.add("js-gantt-d-none");
      } else if (this.isTaskOpened(parentId)) {
        child.classList.remove("js-gantt-d-none");
      }
    });
  }

  // create right sidebar
  createRightSidebar(options, mainContainer) {
    const containerHeight = this.calculateScaleHeight("header");
    const totalWidth = options.columns.reduce(
      (totalWidth, col) => totalWidth + col.width,
      0
    );

    // Using imported createElement utility
    const sidebar = createElement("div", {
      id: "js-gantt-grid-right-data",
      classes: ["js-gantt-right-sidebar-cell"],
      styles: {
        width: `${this.options.rightGridWidth || totalWidth}px`,
        minWidth: `${this.options.rightGridWidth || totalWidth}px`,
      },
    });

    const headCellContainer = createElement("div", {
      classes: ["right-sidebar-head-cell-container"],
      styles: {
        height: containerHeight,
        lineHeight: containerHeight,
      },
    });

    setTimeout(() => {
      setStyles(headCellContainer, { width: `${sidebar.offsetWidth}px` });
    }, 0);
    sidebar.append(headCellContainer);
    let resizerLeft = 0;

    // head loop of left side
    for (let i = 0; i < options.columns.length; i++) {
      const column = options.columns[i];

      // Using imported createElement utility
      const headCell = createElement("div", {
        classes: ["right-head-cell"],
        attributes: { "data-column-index": `r-${i}` },
        styles: { width: `${column.width || 80}px` },
        html: column.label,
      });

      //add custom class from user
      this.addClassesFromFunction(
        this.templates.grid_header_class,
        headCell,
        column,
        i
      );

      headCellContainer.append(headCell);

      if (i < options.columns.length) {
        // Using imported createElement utility
        const resizerWrap = createElement("div", {
          id: `js-gantt-col-resizer-wrap-r-${i}`,
          classes: ["js-gantt-col-resizer-wrap"],
          styles: { height: this.calculateScaleHeight("header") },
        });

        if (column.resize === true) {
          const resizer = createElement("div", {
            classes: ["js-gantt-col-resizer"],
          });
          resizerWrap.append(resizer);
          resizerLeft += column.width || 80;
          setStyles(resizerWrap, { left: `${resizerLeft}px` });
          headCellContainer.append(resizerWrap);
          this.resizeColumns(
            resizerWrap,
            `data-column-index="r-${i}"`,
            headCell,
            headCellContainer,
            column.min_width,
            column.max_width,
            i,
            sidebar,
            true
          );
        }
      }
    }

    // data loop of right side - using imported createElement
    const leftDataContainer = createElement("div", {
      id: "js-gantt-left-grid",
      classes: ["js-gantt-grid-data"],
    });

    setTimeout(() => {
      setStyles(leftDataContainer, { width: `${sidebar.offsetWidth}px` });
    }, 0);

    // loop through all the data
    for (let j = 0; j < options.data.length; j++) {
      const task = this.options.data[j];
      if (!this.isTaskNotInSearchedData(task.id)) {
        // Using imported createElement utility
        const dataItem = createElement("div", {
          classes: ["js-gantt-row-item", "js-gantt-d-flex"],
          attributes: {
            "js-gantt-data-task-id": j,
            "js-gantt-task-id": task.id,
          },
          styles: {
            height: `${options.row_height}px`,
            lineHeight: `${options.row_height}px`,
          },
        });

        //add custom classes from user
        const { start_date, end_date } = this.getLargeAndSmallDate(task);
        this.addClassesFromFunction(
          this.templates.grid_row_class,
          dataItem,
          start_date,
          end_date,
          task
        );

        const that = this;
        // Handle mouseover event
        dataItem.addEventListener("mouseover", () =>
          this.updateTooltipBody(task)
        );

        // Handle mouseleave event
        dataItem.addEventListener("mouseleave", this.hideTooltip.bind(this));

        this.addClickListener(dataItem, (e) => {
          if (hasClass(e.target, "js-gantt-tree-icon")) {
            return;
          }

          const selectedRows = querySelectorAll(".js-gantt-selected", this.element);
          const selectedTaskBars = querySelectorAll(".js-gantt-selected-task-bar", this.element);

          for (const item of selectedRows) {
            removeClass(item, "js-gantt-selected");
          }

          for (const item of selectedTaskBars) {
            removeClass(item, "js-gantt-selected-task-bar");
          }

          // select the selected task taskBar
          const currentTaskBar = querySelector(`[js-gantt-taskbar-id="${task.id}"]`, this.element);
          addClass(currentTaskBar, "js-gantt-selected-task-bar");

          const taskRow = querySelectorAll(`[js-gantt-data-task-id="${j}"]`, this.element);
          for (const item of taskRow) {
            addClass(item, "js-gantt-selected");
          }
          that.options.selectedRow = `${task.id}`;
          that.options.selectedTask = `${task.id}`;
        });

        // loop through all the columns
        for (let k = 0; k < options.columns.length; k++) {
          const column = this.options.columns[k];

          // Using imported createElement utility
          const cell = createElement("div", {
            classes: ["js-gantt-cell"],
            attributes: { "data-column-index": `r-${k}` },
            styles: {
              width: `${column.width || 80}px`,
              ...(column.align && { textAlign: column.align, justifyContent: column.align }),
            },
          });

          //add custom class from user
          this.addClassesFromFunction(
            this.templates.grid_cell_class,
            cell,
            column,
            task
          );

          const content = createElement("div", {
            classes: ["js-gantt-cell-data", k == 0 ? "js-gantt-d-block" : "js-gantt-data"],
            html: column.template(task) || task[column.name] || " ",
          });

          const jsGanttBlank = createElement("div", {
            classes: ["js-gantt-blank"],
            html: this.callTemplate("grid_blank", task),
          });

          if (column.tree) {
            addClass(cell, "js-gantt-d-flex");

            // folder icon - using imported createElement
            const folderIcon = createElement("div", {
              classes: ["js-gantt-folder-icon"],
              html: this.callTemplate("grid_folder", task),
            });

            if (task.children && task.children.length > 0) {
              // tree icon - using imported createElement
              const treeIcon = createElement("div", {
                id: `toggle-tree-${j}`,
                classes: [
                  "js-gantt-tree-icon",
                  !this.isTaskOpened(task.id)
                    ? "js-gantt-tree-close"
                    : "js-gantt-tree-open",
                ],
              });
              cell.append(treeIcon);

              // toggle children
              this.addClickListener(treeIcon, () => {
                const isTaskOpened = hasClass(treeIcon, "js-gantt-tree-close");

                if (isTaskOpened) {
                  this.addTaskToOpenedList(task.id);
                } else {
                  this.removeTaskFromOpenedList(task.id);
                }

                this.setCollapseAll(
                  task.children,
                  task.id,
                  isTaskOpened ? "open" : "collapse"
                );

                this.createTaskBars();

                treeIcon.classList.toggle("js-gantt-tree-close");
                treeIcon.classList.toggle("js-gantt-tree-open");

                // custom event of toggle tree
                this.dispatchEvent("onTaskToggle", {
                  task,
                  isTaskOpened,
                });
              });
            } else {
              cell.append(jsGanttBlank);
            }
            cell.append(folderIcon);
          }
          cell.append(content);
          dataItem.append(cell);
        }

        leftDataContainer.append(dataItem);
      }

      this.createSidebarChild(
        task.children,
        options,
        leftDataContainer,
        1,
        j,
        true,
        this.isTaskOpened(task.id)
      );
    }
    sidebar.append(leftDataContainer);

    // Using imported createElement utility
    const timelineResizerWrap = createElement("div", {
      id: "js-gantt-timeline-resizer-wrap",
      classes: ["js-gantt-timeline-resizer-wrap"],
    });

    const timelineResizer = createElement("div", {
      classes: ["js-gantt-timeline-resizer"],
    });

    timelineResizerWrap.append(timelineResizer);
    setTimeout(() => {
      setStyles(timelineResizerWrap, { left: `${sidebar.offsetLeft}px` });
    }, 0);
    mainContainer.append(timelineResizerWrap);
    this.resizeTimeline(timelineResizerWrap, timelineResizer, options);
    mainContainer.append(sidebar);
  }

  /**
   *
   * @param {HTMLElement} jsGanttLayout - the main layout element of the gantt chart.
   * @param {number} verScrollPos - vertical scrollbar position if it exist.
   * @param {number} horScrollPos - horizontal scrollbar position if it exist.
   */
  createScrollbar(jsGanttLayout, verScrollPos = 0, horScrollPos = 0) {
    const layout = querySelector("#js-gantt-layout", this.element);
    const timeline = querySelector("#js-gantt-timeline-cell", this.element);
    const timelineData = querySelector("#js-gantt-timeline-data", this.element);
    const headerHeight = this.calculateScaleHeight("scroll");
    const sidebar = this.element.querySelector("#js-gantt-grid-left-data");
    const rightSideBar = this.element.querySelector(
      "#js-gantt-grid-right-data"
    );

    const isVerScrollExist = this.element.querySelectorAll(
      ".js-gantt-ver-scroll-cell"
    );
    const isHorScrollExist = this.element.querySelectorAll(
      ".js-gantt-hor-scroll-cell"
    );

    // Create vertical custom scroll
    const verticalScrollContainer = createCustomScrollContainer(
      "js-gantt-ver-scroll-cell"
    );

    const verticalScroll = createCustomScroll("js-gantt-ver-scroll");
    setStyles(verticalScroll, {
      top: `${headerHeight}px`,
      height: `calc(100% - ${headerHeight}px)`,
    });

    // Using imported createElement utility
    const verScrollContent = createElement("div", {
      styles: { height: `${timelineData.scrollHeight - 1}px` },
    });
    verticalScroll.append(verScrollContent);
    verticalScrollContainer.append(verticalScroll);

    // if scrolls exist then remove them then create
    removeExistingScrollElements(isVerScrollExist);
    if (timeline.scrollHeight > timeline.offsetHeight) {
      jsGanttLayout.append(verticalScrollContainer);
    }

    // Create horizontal custom scroll
    const horScrollContainer = createCustomScrollContainer(
      "js-gantt-hor-scroll-cell"
    );
    const horScroll = createCustomScroll("js-gantt-hor-scroll");

    // Using imported createElement utility
    const horScrollContent = createElement("div", {
      styles: {
        width: `${timeline.scrollWidth + (layout.offsetWidth - timeline.offsetWidth)}px`,
      },
    });
    horScroll.append(horScrollContent);
    horScrollContainer.append(horScroll);

    // if scrolls exist then remove them then create
    removeExistingScrollElements(isHorScrollExist);

    if (
      timeline.scrollWidth + (layout.offsetWidth - timeline.offsetWidth) >
      layout.offsetWidth
    ) {
      jsGanttLayout.append(horScrollContainer);
    }

    verticalScroll.scrollTop = verScrollPos || timeline.scrollTop;
    horScroll.scrollLeft = horScrollPos || timeline.scrollLeft;

    const that = this;
    timeline.removeEventListener("scroll", handleCalendarScroll);
    timeline.addEventListener("scroll", handleCalendarScroll);

    function handleCalendarScroll(e) {
      sidebar.scrollTop = timeline.scrollTop;
      horScroll.scrollLeft = timeline.scrollLeft;
      verticalScroll.scrollTop = timeline.scrollTop;
      if (rightSideBar) {
        rightSideBar.scrollTop = timeline.scrollTop;
      }

      that.dispatchEvent("onScroll", { event: e });
    }

    sidebar.removeEventListener("scroll", handleSidebarScroll);
    sidebar.addEventListener("scroll", handleSidebarScroll);

    function handleSidebarScroll() {
      timeline.scrollTop = sidebar.scrollTop;
      verticalScroll.scrollTop = sidebar.scrollTop;
      if (rightSideBar) {
        rightSideBar.scrollTop = sidebar.scrollTop;
      }
    }

    // for horizontal custom scroller
    horScroll.removeEventListener("scroll", handleHorScroll);
    horScroll.addEventListener("scroll", handleHorScroll);

    function handleHorScroll() {
      timeline.scrollLeft = horScroll.scrollLeft;
    }

    // for rightSideBar custom scroll
    if (rightSideBar) {
      rightSideBar.removeEventListener("scroll", handleRightSidebarScroll);
      rightSideBar.addEventListener("scroll", handleRightSidebarScroll);

      function handleRightSidebarScroll() {
        timeline.scrollTop = rightSideBar.scrollTop;
        verticalScroll.scrollTop = rightSideBar.scrollTop;
        sidebar.scrollTop = rightSideBar.scrollTop;
      }
    }

    // for vertical custom scroller
    verticalScroll.addEventListener("scroll", () => {
      timeline.scrollTop = verticalScroll.scrollTop;
      sidebar.scrollTop = verticalScroll.scrollTop;
      if (rightSideBar) {
        rightSideBar.scrollTop = verticalScroll.scrollTop;
      }
    });

    const timelineResizer = querySelector("#js-gantt-timeline-resizer-wrap", this.element);
    if (timelineResizer) {
      setStyles(timelineResizer, { left: `${timeline.offsetLeft + timeline.offsetWidth}px` });
    }

    // Helper function using imported createElement
    function createCustomScrollContainer(id) {
      return createElement("div", {
        id: id,
        classes: [id],
      });
    }

    // Helper function using imported createElement
    function createCustomScroll(className) {
      return createElement("div", {
        classes: [className],
      });
    }

    function removeExistingScrollElements(scrollElements) {
      if (scrollElements) {
        for (const scroll of scrollElements) {
          scroll.remove();
        }
      }
    }

    if (
      this.options.mouseScroll &&
      (this.options.ctrlKeyRequiredForMouseScroll ||
        !this.options.selectAreaOnDrag)
    ) {
      this.addMouseScroll(verticalScroll, horScroll);
    }
  }

  resizeTimeline(resizer, resizerLine, options) {
    let timeLineResizing = false,
      that = this,
      startX,
      resizerLeft,
      size,
      leftResizer;

    resizer.removeEventListener("mousedown", handleMouseDown);
    resizer.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(event) {
      startX = event.x;
      leftResizer = that.element.querySelector(
        "#js-gantt-left-layout-resizer-wrap"
      );
      resizerLeft = resizer.offsetLeft;
      resizerLine.classList.add("resizing");

      // mouse move event
      document.addEventListener("mousemove", resize, false);
      // mouseup event
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp(e) {
      document.removeEventListener("mousemove", resize, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      if (timeLineResizing) {
        const rightSideBar = that.element.querySelector(
          "#js-gantt-grid-right-data"
        );

        let widthSize = rightSideBar.offsetWidth + (startX - e.x);

        widthSize =
          leftResizer.offsetLeft + 80 >= size
            ? widthSize - (leftResizer.offsetLeft + 80 - size)
            : widthSize;

        const totalMinWidth = options.columns.reduce(
          (totalWidth, col) => totalWidth + (col.min_width || 80),
          0
        );

        widthSize = widthSize < totalMinWidth ? totalMinWidth : widthSize;

        rightSideBar.style.width = `${widthSize}px`;
        rightSideBar.style.minWidth = `${widthSize}px`;

        let resizerLeft = 0,
          headerCell = document.getElementsByClassName("right-head-cell");

        for (let j = 0; j < headerCell.length; j++) {
          const columns = that.element.querySelectorAll(
            `[data-column-index="r-${j}"]`
          );

          // let incrasedWidth = widthSize / options.columns.length;
          const resizerWrap = document.getElementById(
            `js-gantt-col-resizer-wrap-r-${j}`
          );

          let colWidth =
            headerCell[j].offsetWidth + (startX - e.x) / options.columns.length;

          colWidth =
            colWidth < (options.columns[j]?.min_width || 80)
              ? options.columns[j]?.min_width || 80
              : colWidth;

          // set the sidebar columns width
          for (const col of columns) {
            col.style.width = `${colWidth}px`;
          }

          that.options.rightGrid[j].width = colWidth;

          // set the sidebar columns resizer left
          resizerLeft += headerCell[j].offsetWidth;
          if (resizerWrap) {
            resizerWrap.style.left = `${resizerLeft}px`;
          }
        }

        that.options.rightGridWidth = rightSideBar.offsetWidth;

        if (
          that.calculateTimeLineWidth("updated") ===
          that.calculateTimeLineWidth("current")
        ) {
          const jsGanttLayout = that.element.querySelector(".js-gantt-layout");
          that.createScrollbar(jsGanttLayout);
        } else {
          // rerender the calendar and scale
          that.updateBody();
        }
      }
      resizerLine.classList.remove("resizing");
      timeLineResizing = false;
    }

    // resize the sidebar
    function resize(e) {
      timeLineResizing = true;
      size = resizerLeft + (e.x - startX);
      resizer.style.left = `${size}px`;
    }
  }

  /**
   * Retrieves a task from the data based on its ID.
   * @param {number | string} id - The ID of the task to retrieve.
   * @param {Array} data (optional)- The data array to search for the task (defaults to options.data).
   * @returns {Object|null} - The task object if found, otherwise null.
   */
  getTask(id, data = this.options.data) {
    for (const item of data) {
      if (item.id == id) {
        return item;
      }

      if (Array.isArray(item?.children)) {
        const found = this.getTask(id, item.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Filter tasks based on user-defined conditions.
   * @param {Function} condition - The condition function used to filter tasks.
   * @param {boolean} isFilter - Indicates whether to apply the filter or reset.
   * @param {boolean} findRecursive - Indicates whether to find recursive parent-child tasks.
   */
  filterTask(condition, isFilter, findRecursive = false) {
    const parents = new Set();
    const that = this;

    const debouncedFilterTask = this.debounce(
      "filterTaskTimer",
      () => {
        if (!this.#searchedData) {
          this.oldOpenedTasks = [...this.options.openedTasks];
        }

        this.selectedRow = undefined;
        const allData = this.options.data; // Avoid unnecessary cloning

        if (!isFilter) {
          this.#searchedData = undefined;
          this.options.openedTasks = this.oldOpenedTasks;
          this.render();
          return;
        }

        this.#searchedData = findTask(allData, condition);

        this.render();
      },
      300
    );

    debouncedFilterTask();

    function findTask(data, condition) {
      const result = new Set();

      data.forEach((item) => {
        if (condition(item)) {
          result.add(item.id);
          if (that.options.splitTask || findRecursive) {
            findParents(item, result);
          }
        }
        if (Array.isArray(item.children)) {
          const filteredChildrenIds = findTask(item.children, condition);
          filteredChildrenIds.forEach((id) => result.add(id));
        }
      });

      return Array.from(result);
    }

    function findParents(item, result) {
      while (item.parent && item.parent != 0 && !parents.has(item.parent)) {
        parents.add(item.parent);
        result.add(item.parent);
        const parentItem = that.getTask(item.parent);
        if (parentItem) {
          item = parentItem;
        } else {
          break;
        }
      }
    }
  }

  /**
   * Method to add marker to the gantt.
   * @param {Object} marker - marker object.
   */
  addMarker(marker) {
    this.options.customMarker.push(marker);
  }

  // add custom marker to gantt
  addMarkerToGantt(data) {
    const markerStartDate = new Date(data.start_date);
    const isWeekend = this.options.weekends.includes(
      this.#dateFormat.day_short[markerStartDate.getDay()]
    );
    const isFullWeek = this.options.fullWeek;

    if (!isFullWeek && isWeekend) {
      return;
    }

    const { markerArea } = this;
    const startDate = new Date(this.options.startDate);
    let daysDiff = this.getDates(startDate, markerStartDate);
    daysDiff = daysDiff.length - 1 || 0;
    const colWidth = this.calculateGridWidth(data.start_date, "day");

    // Using imported createElement utility
    const cssClasses = ["js-gantt-marker", ...data.css.trim().replace(/\s+/g, " ").split(" ")];
    const flag = createElement("div", {
      classes: cssClasses,
      attributes: { title: data.title },
      styles: { left: `${colWidth * daysDiff + colWidth / 2}px` },
    });

    const flagText = createElement("div", {
      classes: ["js-gantt-marker-content"],
      html: data.text,
    });

    flag.append(flagText);
    markerArea.append(flag);
  }

  /**
   * Attaches an event listener to the element and handles the event callback.
   *
   * @param {string} name - The name of the event to listen for.
   * @param {Function} callback - The callback function to execute when the event is triggered.
   */
  attachEvent(name, callback) {
    const eventNamesToCheck = [
      "onBeforeTaskDrag",
      "onBeforeTaskDrop",
      "onBeforeProgressDrag",
      "onBeforeLinkAdd",
      "onBeforeTaskDblClick",
    ];

    // Use EventManager for internal event tracking
    this.#eventManager.on(name, callback);

    this.element.addEventListener(name, handleEvent);

    const that = this;

    function handleEvent(e) {
      if (eventNamesToCheck.includes(name)) {
        that.eventValue = callback(e.detail);
        that.eventValue = that.eventValue !== false;
      } else {
        callback(e.detail);
      }
    }
  }

  /**
   * Dispatches a custom event with the provided event name and detail.
   * Uses EventManager for internal event dispatching
   * @param {string} eventName - The name of the custom event to dispatch.
   * @param {any} detail - Additional data to include with the event.
   */
  dispatchEvent(eventName, detail) {
    // Emit via EventManager
    this.#eventManager.emit(eventName, detail);

    // Also dispatch DOM event for backward compatibility
    const event = new CustomEvent(eventName, { detail });
    if (this.element) {
      this.element.dispatchEvent(event);
    }
  }

  // get the position of a cell
  posFromDate(date) {
    date = new Date(date);
    const pxPerHour = this.calculateGridWidth(date) / 24;
    const hours = date.getHours();
    const pixels = Math.floor(hours * pxPerHour);
    let cellBefore = this.getDates(this.options.startDate, date);
    let isCellGreater = true;

    if (cellBefore.length === 0) {
      cellBefore = this.getDates(date, this.options.startDate);
      isCellGreater = false;
    }

    cellBefore = isCellGreater
      ? cellBefore.length - 1
      : -(cellBefore.length - 1);

    // return the left of the cell of given date
    return Math.floor(cellBefore * this.calculateGridWidth(date) + pixels);
  }

  /**
   * Method to set the gantt to process data again.
   */
  clearAll() {
    this.#arrangeData = true;
    this.options.openedTasks.length = 0;
  }

  /**
   * Method to iterate of all the tasks.
   * @param {Function} callBack - A callback function.
   */
  eachTask(callBack) {
    // Recursive function to iterate over nested data
    const iterateOverData = (array) => {
      array.forEach((task, index) => {
        callBack(task, array, index);
        if (Array.isArray(task.children)) {
          iterateOverData(task.children);
        }
      });
    };

    // Start iteration from the root of the data
    iterateOverData(this.options.data);
  }

  /**
   * Updates the duration of each task in the data
   */
  updateTaskDuration() {
    this.eachTask((task) => {
      const { start_date, end_date } = this.getLargeAndSmallDate(task);
      task.duration = this.getDates(start_date, end_date, false)?.length || 0;
    });
  }

  // open a specific task tree
  openTask(id) {
    if (!id || this.isTaskOpened(id)) {
      return;
    }

    const sidebar = this.element.querySelector("#js-gantt-left-grid");
    const taskRow = sidebar.querySelector(`[js-gantt-task-id="${id}"]`);
    const children = this.element.querySelectorAll(`.js-gantt-child-${id}`);
    const jsGanttLayout = this.element.querySelector("#js-gantt-layout");
    const toggleTreeIcon = taskRow.querySelector(".js-gantt-tree-icon");

    const task = this.getTask(id);
    if (task.parent !== 0) {
      this.openTask(task.parent);
    }

    if (!this.isTaskOpened(id)) {
      this.addTaskToOpenedList(id);
    }
    this.createTaskBars();

    children.forEach((child) => {
      child.classList.remove("js-gantt-d-none");
      child.classList.add("js-gantt-d-flex");
    });

    if (toggleTreeIcon) {
      toggleTreeIcon.classList.remove("js-gantt-tree-close");
      toggleTreeIcon.classList.add("js-gantt-tree-open");
    }
    const verScroll =
      this.element.querySelector(".js-gantt-ver-scroll")?.scrollTop || 0;
    const horScroll =
      this.element.querySelector(".js-gantt-hor-scroll")?.scrollLeft || 0;
    this.createScrollbar(jsGanttLayout, verScroll, horScroll);
  }

  /**
   * Method to set the new data to the existing data
   * @param { Array } data - data to add in the existin gantt data.
   */
  parse(data) {
    const uniqueData = data.filter((obj) => !this.getTask(obj.id));

    this.options.data = [...this.originalData, ...uniqueData];
    this.#arrangeData = true;

    if (this.options.collapse === false) {
      // Set opened tasks
      const uniqueIds = uniqueData.map((task) => task.id);
      this.addTaskToOpenedList(...uniqueIds);
    }
  }

  // split hour and minutes from decimal
  convertDecimalToTime(decimalTime) {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    return { hours, minutes };
  }

  // get time from pixels
  getTimeByPx(pixels, date) {
    const pxPerMin = this.calculateGridWidth(date, "day") / (24 * 60);
    const dateTime = pixels / pxPerMin / 60;
    const { hours, minutes } = this.convertDecimalToTime(dateTime);
    return { hours, minutes };
  }

  // get pixels from time
  getPxByTime(date, type) {
    let hours = new Date(date).getHours();
    if (type === "width") {
      hours = hours === 0 ? 0 : 23 - hours;
    }
    const pxPerHour = this.calculateGridWidth(date, "day") / 24;
    const pixels = hours * pxPerHour;
    return pixels;
  }

  /**
   * Creates links between tasks.
   *
   * Type of links -
   *
   * 0 is  finish_to_start
   * 1 is  start_to_start
   * 2 is  finish_to_finish
   * 3 is  start_to_finish
   * @param {string | number} sourceId - The id of the source task.
   * @param {string | number} targetId - The id of the target task.
   * @param {object} link - The link object containing link type information.
   */
  createLinks(sourceId, targetId, link) {
    const linksArea = this.element.querySelector("#js-gantt-links-area");

    const source = this.element.querySelector(
      `[js-gantt-taskbar-id="${sourceId}"]`
    );
    const target = this.element.querySelector(
      `[js-gantt-taskbar-id="${targetId}"]`
    );

    const linkType = link.type || 0;

    const createLink = this.isTaskExistOrHidden(source, target);

    if (!createLink) {
      return;
    }

    const rowHeight =
        this.element.querySelector(".js-gantt-bar-task").offsetHeight,
      sourceLeft = source.offsetLeft,
      sourceWidth = source.offsetWidth,
      sourceTop = source.offsetTop,
      targetLeft = target.offsetLeft,
      targetWidth = target.offsetWidth,
      targetTop = target.offsetTop,
      extraHeight =
        (this.options.row_height -
          Math.floor((this.options.row_height * 80) / 100)) /
        2 -
        1;

    // Using imported createElement utility
    const taskLink = createElement("div", {
      classes: ["js-gantt-task-link"],
      attributes: {
        "link-id": link.id,
        "link-type": linkType,
      },
    });
    linksArea.append(taskLink);

    const that = this;
    // handle double click event
    taskLink.addEventListener("dblclick", () => {
      that.dispatchEvent("onLinkDblClick", { link });
    });

    // Using imported createElement utility
    const startLine = createElement("div", {
      classes: ["js-gantt-hor-link-line", "js-gantt-link-line"],
    });

    const middleLine = createElement("div", {
      classes: ["js-gantt-ver-link-line", "js-gantt-link-line"],
    });

    const endLine = createElement("div", {
      classes: ["js-gantt-hor-link-line", "js-gantt-link-line"],
    });

    const linkVerInnerLine = createElement("div", {
      classes: ["ver-inner-line"],
    });

    const linkHorInnerLine = createElement("div", {
      classes: ["hor-inner-line"],
    });

    if (linkType == 0) {
      // 0 is  finish_to_start
      startLine.style.left = `${sourceLeft + sourceWidth}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      startLine.style.width = `${15}px`;
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        // Using imported createElement utility
        const middleLine = createElement("div", {
          classes: ["js-gantt-ver-link-line", "js-gantt-link-line"],
        });
        setStyles(middleLine, {
          left: `${startLine.offsetLeft + startLine.offsetWidth - 2}px`,
        });
        if (sourceTop < targetTop) {
          setStyles(middleLine, {
            top: `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`,
            height: `${source.offsetHeight / 2 + (extraHeight + 2)}px`,
          });
        } else {
          setStyles(middleLine, {
            top: `${Math.min(sourceTop, targetTop) + rowHeight + (extraHeight + 2)}px`,
            height: `${Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight}px`,
          });
        }
        const innerLine = linkVerInnerLine.cloneNode(true);
        middleLine.append(innerLine);
        taskLink.append(middleLine);

        // Using imported createElement utility
        const horLine = createElement("div", {
          classes: ["js-gantt-hor-link-line", "js-gantt-link-line"],
        });
        setStyles(horLine, {
          left: `${targetLeft - 15}px`,
          top: `${Math.min(sourceTop, targetTop) + source.offsetHeight + extraHeight}px`,
          width: `${Math.abs(startLine.offsetLeft + startLine.offsetWidth - targetLeft) + 15}px`,
        });
        const innerHorLine = linkHorInnerLine.cloneNode(true);
        horLine.append(innerHorLine);
        taskLink.append(horLine);
      }

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        middleLine.style.left = `${target.offsetLeft - 15}px`;
        if (sourceTop < targetTop) {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight + (extraHeight + 2)
          }px`;
          middleLine.style.height = `${
            Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight
          }px`;
        } else {
          middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
          middleLine.style.height = `${source.offsetHeight / 2 + extraHeight}px`;
        }
      } else {
        middleLine.style.left = `${startLine.offsetLeft + startLine.offsetWidth - 2}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        endLine.style.left = `${middleLine.offsetLeft}px`;
        endLine.style.top = `${targetTop + rowHeight / 2}px`;
        endLine.style.width = `${15}px`;
      } else {
        endLine.style.left = `${middleLine.offsetLeft}px`;
        endLine.style.top = `${targetTop + rowHeight / 2}px`;
        endLine.style.width = `${Math.abs(
          startLine.offsetLeft + startLine.offsetWidth - targetLeft
        )}px`;
      }

      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    } else if (linkType == 1) {
      // 1 is start_to_start
      startLine.style.left = `${Math.min(sourceLeft, targetLeft) - 15}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      if (sourceLeft > targetLeft) {
        startLine.style.width = `${Math.abs(sourceLeft - targetLeft) + 15}px`;
      } else {
        startLine.style.width = `${15}px`;
      }
      const innerHorLine = linkVerInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft >= targetLeft) {
        middleLine.style.left = `${target.offsetLeft - 15}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      } else {
        middleLine.style.left = `${startLine.offsetLeft}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${middleLine.offsetLeft}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      endLine.style.width = `${targetLeft - middleLine.offsetLeft}px`;
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    } else if (linkType == 2) {
      // 2 is  finish_to_finish
      startLine.style.left = `${sourceLeft + sourceWidth}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      if (sourceLeft + sourceWidth < targetLeft + targetWidth) {
        startLine.style.width = `${
          Math.abs(sourceLeft + sourceWidth - (targetLeft + targetWidth)) + 15
        }px`;
      } else {
        startLine.style.width = `${15}px`;
      }
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      middleLine.style.left = `${
        startLine.offsetLeft + startLine.offsetWidth
      }px`;
      middleLine.style.top = `${
        Math.min(sourceTop, targetTop) + rowHeight / 2
      }px`;
      middleLine.style.height = `${Math.abs(sourceTop - targetTop) + 2}px`;
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${targetLeft + targetWidth}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      endLine.style.width = `${
        Math.abs(targetLeft + targetWidth - middleLine.offsetLeft) + 2
      }px`;
      const innerEndHorLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndHorLine);
      taskLink.append(endLine);
    } else if (linkType == 3) {
      // 3 is  start_to_finish
      if (sourceLeft > targetLeft + targetWidth) {
        startLine.style.left = `${targetLeft + targetWidth + 15}px`;
        startLine.style.width = `${
          sourceLeft - (targetLeft + targetWidth) - 15
        }px`;
      } else {
        startLine.style.left = `${sourceLeft - 15}px`;
        startLine.style.width = `${15}px`;
      }
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft <= targetLeft + targetWidth) {
        const middleLine = document.createElement("div");
        middleLine.classList.add(
          "js-gantt-ver-link-line",
          "js-gantt-link-line"
        );
        middleLine.style.left = `${startLine.offsetLeft}px`;
        if (sourceTop < targetTop) {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight / 2
          }px`;
          middleLine.style.height = `${
            source.offsetHeight / 2 + (extraHeight + 2)
          }px`;
        } else {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight + (extraHeight + 2)
          }px`;
          middleLine.style.height = `${
            Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight
          }px`;
        }
        const innerLine = linkVerInnerLine.cloneNode(true);
        middleLine.append(innerLine);
        taskLink.append(middleLine);

        const horLine = document.createElement("div");
        horLine.classList.add("js-gantt-hor-link-line", "js-gantt-link-line");
        horLine.style.left = `${startLine.offsetLeft}px`;
        horLine.style.top = `${
          Math.min(sourceTop, targetTop) + source.offsetHeight + extraHeight
        }px`;
        horLine.style.width = `${
          Math.abs(targetLeft + targetWidth - startLine.offsetLeft) + 15
        }px`;
        const innerHorLine = linkHorInnerLine.cloneNode(true);
        horLine.append(innerHorLine);
        taskLink.append(horLine);
      }

      middleLine.style.left = `${targetLeft + targetWidth + 15}px`;
      if (sourceTop < targetTop) {
        if (sourceLeft > targetLeft + targetWidth) {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight / 2
          }px`;
          middleLine.style.height = `${Math.abs(sourceTop - targetTop) + 2}px`;
        } else {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight + extraHeight
          }px`;
          middleLine.style.height = `${
            Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight + 2
          }px`;
        }
      } else {
        middleLine.style.top = `${
          Math.min(sourceTop, targetTop) + rowHeight / 2
        }px`;
        if (sourceLeft > targetLeft + targetWidth) {
          middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
        } else {
          middleLine.style.height = `${
            source.offsetHeight / 2 + (extraHeight + 2)
          }px`;
        }
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${targetLeft + targetWidth}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      endLine.style.width = `${15}px`;
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    }

    if (this.options.updateLinkOnDrag) {
      // call updateLinkPosition function onTaskDrag
      this.attachEvent("onTaskDrag", () => {
        this.updateLinkPosition(source, target, taskLink, rowHeight, link);
      });
    }

    // call updateLinkPosition function onAfterTaskDrag
    this.attachEvent("onAfterTaskDrag", () => {
      this.updateLinkPosition(source, target, taskLink, rowHeight, link);
    });

    // call updateLinkPosition function onAutoScheduling
    this.attachEvent("onAutoScheduling", () => {
      this.updateLinkPosition(source, target, taskLink, rowHeight, link);
    });
  }

  /**
   * Method to update the position of a link between two tasks.
   * @param {HTMLElement} source - The source task element.
   * @param {HTMLElement} target - The target task element.
   * @param {HTMLElement} link - The link element.
   * @param {number} rowHeight - The height of a row.
   * @param {object} linkObj - The link object containing information about the link.
   */
  updateLinkPosition(source, target, link, rowHeight, linkObj) {
    const sourceLeft = source.offsetLeft,
      sourceWidth = source.offsetWidth,
      sourceTop = source.offsetTop,
      targetLeft = target.offsetLeft,
      targetWidth = target.offsetWidth,
      targetTop = target.offsetTop,
      extraHeight =
        (this.options.row_height -
          Math.floor((this.options.row_height * 80) / 100)) /
        2 -
        1;

    const taskLink = document.createElement("div");
    taskLink.setAttribute("link-id", linkObj.id);
    taskLink.classList.add("js-gantt-task-link");

    const startLine = document.createElement("div");
    startLine.classList.add("js-gantt-hor-link-line", "js-gantt-link-line");

    const middleLine = document.createElement("div");
    middleLine.classList.add("js-gantt-ver-link-line", "js-gantt-link-line");

    const endLine = document.createElement("div");
    endLine.classList.add("js-gantt-hor-link-line", "js-gantt-link-line");

    const linkVerInnerLine = document.createElement("div");
    linkVerInnerLine.classList.add("ver-inner-line");

    const linkHorInnerLine = document.createElement("div");
    linkHorInnerLine.classList.add("hor-inner-line");

    const linkType = linkObj.type || 0;

    if (linkType === 0) {
      // 0 is  finish_to_start
      startLine.style.left = `${sourceLeft + sourceWidth}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      startLine.style.width = `${15}px`;
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        const middleLine = document.createElement("div");
        middleLine.classList.add(
          "js-gantt-ver-link-line",
          "js-gantt-link-line"
        );
        middleLine.style.left = `${sourceLeft + sourceWidth + 15}px`;
        if (sourceTop < targetTop) {
          middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
          middleLine.style.height = `${source.offsetHeight / 2 + (extraHeight + 2)}px`;
        } else {
          if (Math.abs(sourceTop - targetTop) <= rowHeight / 2) {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) +
              rowHeight / 2 +
              Math.abs(sourceTop - targetTop)
            }px`;
            middleLine.style.height = `${Math.abs(
              sourceTop - targetTop - rowHeight / 2 - (extraHeight + 2)
            )}px`;
          } else {
            middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight + extraHeight}px`;
            middleLine.style.height = `${Math.abs(sourceTop - targetTop) - rowHeight / 2}px`;
          }
        }
        const innerLine = linkVerInnerLine.cloneNode(true);
        middleLine.append(innerLine);
        taskLink.append(middleLine);

        const horLine = document.createElement("div");
        horLine.classList.add("js-gantt-hor-link-line", "js-gantt-link-line");
        horLine.style.left = `${targetLeft - 15}px`;
        horLine.style.top = `${
          Math.min(sourceTop, targetTop) + source.offsetHeight + extraHeight
        }px`;
        if (0 < sourceLeft + sourceWidth + 15 - targetLeft <= 15) {
          horLine.style.width = `${Math.abs(sourceLeft + sourceWidth + 15 - targetLeft) + 15}px`;
        } else {
          horLine.style.width = `${Math.abs(sourceLeft + sourceWidth - targetLeft) + 30}px`;
        }
        const innerHorLine = linkHorInnerLine.cloneNode(true);
        horLine.append(innerHorLine);
        taskLink.append(horLine);
      }

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        middleLine.style.left = `${target.offsetLeft - 15}px`;
        if (sourceTop < targetTop) {
          if (Math.abs(sourceTop - targetTop) <= rowHeight / 2) {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) +
              rowHeight / 2 +
              Math.abs(sourceTop - targetTop)
            }px`;
            middleLine.style.height = `${Math.abs(
              sourceTop - targetTop + rowHeight / 2 + extraHeight
            )}px`;
          } else {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) + rowHeight + (extraHeight + 2)
            }px`;
            middleLine.style.height = `${
              Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight
            }px`;
          }
        } else {
          middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
          middleLine.style.height = `${source.offsetHeight / 2 + extraHeight}px`;
        }
      } else {
        middleLine.style.left = `${sourceLeft + sourceWidth + 13}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2 + 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      if (sourceLeft + sourceWidth + 15 >= targetLeft) {
        endLine.style.left = `${targetLeft - 15}px`;
        endLine.style.top = `${targetTop + rowHeight / 2}px`;
        endLine.style.width = `${15}px`;
      } else {
        endLine.style.left = `${sourceLeft + sourceWidth + 13}px`;
        endLine.style.top = `${targetTop + rowHeight / 2}px`;
        endLine.style.width = `${Math.abs(sourceLeft + sourceWidth + 15 - targetLeft)}px`;
      }
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    } else if (linkType === 1) {
      // 1 is  start_to_start
      startLine.style.left = `${Math.min(sourceLeft, targetLeft) - 15}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      if (sourceLeft > targetLeft) {
        startLine.style.width = `${Math.abs(sourceLeft - targetLeft) + 15}px`;
      } else {
        startLine.style.width = `${15}px`;
      }
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft >= targetLeft) {
        middleLine.style.left = `${targetLeft - 15}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      } else {
        middleLine.style.left = `${Math.min(sourceLeft, targetLeft) - 15}px`;
        middleLine.style.top = `${Math.min(sourceTop, targetTop) + rowHeight / 2}px`;
        middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${Math.min(targetLeft, sourceLeft) - 15}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      endLine.style.width = `${
        targetLeft - (Math.min(targetLeft, sourceLeft) - 15)
      }px`;
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    } else if (linkType === 2) {
      // 2 is  finish_to_finish
      startLine.style.left = `${sourceLeft + sourceWidth}px`;
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      if (sourceLeft + sourceWidth < targetLeft + targetWidth) {
        startLine.style.width = `${
          Math.abs(sourceLeft + sourceWidth - (targetLeft + targetWidth)) + 15
        }px`;
      } else {
        startLine.style.width = `${15}px`;
      }
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      middleLine.style.left = `${
        Math.max(targetLeft + targetWidth, sourceLeft + sourceWidth) + 15
      }px`;
      middleLine.style.top = `${
        Math.min(sourceTop, targetTop) + rowHeight / 2
      }px`;
      middleLine.style.height = `${Math.abs(sourceTop - targetTop) + 2}px`;
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${targetLeft + targetWidth}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      if (sourceLeft + sourceWidth < targetLeft + targetWidth) {
        endLine.style.width = `${15}px`;
      } else {
        endLine.style.width = `${
          Math.abs(targetLeft + targetWidth - (sourceLeft + sourceWidth)) + 15
        }px`;
      }
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    } else if (linkType === 3) {
      // 3 is  start_to_finish
      startLine.style.top = `${sourceTop + rowHeight / 2}px`;
      if (sourceLeft > targetLeft + targetWidth + 30) {
        startLine.style.left = `${targetLeft + targetWidth + 15}px`;
        startLine.style.width = `${
          sourceLeft - (targetLeft + targetWidth) - 15
        }px`;
      } else {
        startLine.style.left = `${sourceLeft - 15}px`;
        startLine.style.width = `${15}px`;
      }
      const innerHorLine = linkHorInnerLine.cloneNode(true);
      startLine.append(innerHorLine);
      taskLink.append(startLine);

      if (sourceLeft - 30 < targetLeft + targetWidth) {
        const middleLine = document.createElement("div");
        middleLine.classList.add(
          "js-gantt-ver-link-line",
          "js-gantt-link-line"
        );
        middleLine.style.left = `${sourceLeft - 15}px`;
        if (sourceTop < targetTop) {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight / 2
          }px`;
          middleLine.style.height = `${
            source.offsetHeight / 2 + (extraHeight + 2)
          }px`;
        } else {
          if (Math.abs(sourceTop - targetTop) <= rowHeight / 2) {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) +
              rowHeight / 2 +
              Math.abs(sourceTop - targetTop)
            }px`;
            middleLine.style.height = `${Math.abs(
              sourceTop - targetTop - rowHeight / 2 - (extraHeight + 2)
            )}px`;
          } else {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) + rowHeight + (extraHeight + 2)
            }px`;
            middleLine.style.height = `${
              Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight
            }px`;
          }
        }
        const innerLine = linkVerInnerLine.cloneNode(true);
        middleLine.append(innerLine);
        taskLink.append(middleLine);

        const horLine = document.createElement("div");
        horLine.classList.add("js-gantt-hor-link-line", "js-gantt-link-line");
        horLine.style.left = `${sourceLeft - 15}px`;
        horLine.style.top = `${
          Math.min(sourceTop, targetTop) + source.offsetHeight + extraHeight
        }px`;
        if (sourceLeft > targetLeft + targetWidth) {
          horLine.style.width = `${Math.abs(
            targetLeft + targetWidth + 15 - (sourceLeft - 15)
          )}px`;
        } else {
          horLine.style.width = `${
            Math.abs(targetLeft + targetWidth - sourceLeft) + 30
          }px`;
        }
        const innerHorLine = linkHorInnerLine.cloneNode(true);
        horLine.append(innerHorLine);
        taskLink.append(horLine);
      }

      middleLine.style.left = `${targetLeft + targetWidth + 15}px`;
      if (sourceTop < targetTop) {
        if (sourceLeft - 15 >= targetLeft + targetWidth + 15) {
          middleLine.style.top = `${
            Math.min(sourceTop, targetTop) + rowHeight / 2 + 2
          }px`;
          middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
        } else {
          if (Math.abs(sourceTop - targetTop) <= rowHeight / 2) {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) +
              rowHeight / 2 +
              Math.abs(sourceTop - targetTop)
            }px`;
            middleLine.style.height = `${Math.abs(
              sourceTop - targetTop + rowHeight / 2 + extraHeight + 2
            )}px`;
          } else {
            middleLine.style.top = `${
              Math.min(sourceTop, targetTop) + rowHeight + extraHeight
            }px`;
            middleLine.style.height = `${
              Math.abs(sourceTop - targetTop) - rowHeight / 2 - extraHeight + 2
            }px`;
          }
        }
      } else {
        middleLine.style.top = `${
          Math.min(sourceTop, targetTop) + rowHeight / 2
        }px`;
        if (sourceLeft - 15 >= targetLeft + targetWidth + 15) {
          middleLine.style.height = `${Math.abs(sourceTop - targetTop)}px`;
        } else {
          middleLine.style.height = `${
            source.offsetHeight / 2 + (extraHeight + 2)
          }px`;
        }
      }
      const innerLine = linkVerInnerLine.cloneNode(true);
      middleLine.append(innerLine);
      taskLink.append(middleLine);

      endLine.style.left = `${targetLeft + targetWidth}px`;
      endLine.style.top = `${targetTop + rowHeight / 2}px`;
      endLine.style.width = `${15}px`;
      const innerEndLine = linkHorInnerLine.cloneNode(true);
      endLine.append(innerEndLine);
      taskLink.append(endLine);
    }
    link.innerHTML = taskLink.innerHTML;
  }

  /**
   * Method to delete a link by its ID.
   * Uses LinkManager for link removal.
   * @param {string | number} id - The ID of the link to be deleted.
   */
  deleteLink(id) {
    const linkElement = querySelector(`[link-id="${id}"]`, this.element);
    if (linkElement) {
      linkElement.remove();

      // Use LinkManager to remove link if available
      let removedLink = null;
      if (this.#linkManager) {
        removedLink = this.#linkManager.removeLinkById(id);
      }

      // Also update options.links for backward compatibility
      const linkIndex = this.options.links.findIndex((obj) => obj.id == id);
      const linkobj = removedLink || this.options.links.find((obj) => obj.id === id) || null;
      if (linkIndex !== -1) {
        this.options.links.splice(linkIndex, 1);
      }

      this.dispatchEvent("onDeleteLink", { link: linkobj });
    }
  }

  /**
   * Get all links for a specific task using LinkManager.
   * @param {string | number} taskId - The task ID.
   * @returns {Object} {incoming: Array, outgoing: Array} - Links coming to and from the task.
   */
  getTaskLinks(taskId) {
    if (this.#linkManager) {
      return this.#linkManager.getTaskLinks(taskId);
    }
    // Fallback to options.links
    return {
      incoming: this.options.links.filter((l) => l.target === taskId),
      outgoing: this.options.links.filter((l) => l.source === taskId),
    };
  }

  /**
   * Get predecessor task IDs for a task using LinkManager.
   * @param {string | number} taskId - The task ID.
   * @returns {Array} Array of predecessor task IDs.
   */
  getPredecessors(taskId) {
    if (this.#linkManager) {
      return this.#linkManager.getPredecessors(taskId);
    }
    return this.options.links.filter((l) => l.target === taskId).map((l) => l.source);
  }

  /**
   * Get successor task IDs for a task using LinkManager.
   * @param {string | number} taskId - The task ID.
   * @returns {Array} Array of successor task IDs.
   */
  getSuccessors(taskId) {
    if (this.#linkManager) {
      return this.#linkManager.getSuccessors(taskId);
    }
    return this.options.links.filter((l) => l.source === taskId).map((l) => l.target);
  }

  /**
   * Check if adding a link would create a circular dependency.
   * Uses LinkManager's cycle detection.
   * @param {string | number} sourceId - Source task ID.
   * @param {string | number} targetId - Target task ID.
   * @returns {boolean} True if adding the link would create a cycle.
   */
  wouldCreateCycle(sourceId, targetId) {
    if (this.#linkManager) {
      return this.#linkManager.wouldCreateCycle(sourceId, targetId);
    }
    // Simple fallback - check if target is an ancestor of source
    const visited = new Set();
    const stack = [targetId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === sourceId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const successors = this.options.links
        .filter((l) => l.source === current)
        .map((l) => l.target);
      stack.push(...successors);
    }
    return false;
  }

  /**
   * Get the name of a link type.
   * @param {string} type - Link type code (0, 1, 2, 3).
   * @returns {string} Human-readable link type name.
   */
  getLinkTypeName(type) {
    if (this.#linkManager) {
      return this.#linkManager.getLinkTypeName(type);
    }
    const types = {
      0: "Finish-to-Start (FS)",
      1: "Start-to-Start (SS)",
      2: "Finish-to-Finish (FF)",
      3: "Start-to-Finish (SF)",
    };
    return types[type] || "Unknown";
  }

  /**
   * Validate all links against current tasks.
   * @returns {Object} {valid: boolean, errors: Array} - Validation result.
   */
  validateLinks() {
    const taskIds = this.originalData.map((task) => task.id);
    if (this.#linkManager) {
      return this.#linkManager.validateLinks(taskIds);
    }
    // Fallback validation
    const errors = [];
    const taskIdSet = new Set(taskIds);
    this.options.links.forEach((link, index) => {
      if (!taskIdSet.has(link.source)) {
        errors.push(`Link ${index}: Source task ${link.source} not found`);
      }
      if (!taskIdSet.has(link.target)) {
        errors.push(`Link ${index}: Target task ${link.target} not found`);
      }
      if (link.source === link.target) {
        errors.push(`Link ${index}: Self-referencing link`);
      }
    });
    return { valid: errors.length === 0, errors };
  }

  /**
   * Method to create a new link between two tasks.
   * @param {HTMLElement} linkPoint - The link point element.
   * @param {HTMLElement} source - The source task element.
   * @param {string | number} sourceId - The ID of the source task.
   * @param {string} type - The type of link point ('left' or 'right').
   */
  createNewLink(linkPoint, source, sourceId, type) {
    let strech = false,
      startX,
      startY,
      targetId,
      targetType,
      that = this,
      autoScroll = false,
      rightPanelScroll,
      barsArea,
      linkDirection;

    linkPoint.removeEventListener("mousedown", handleMouseDown);
    linkPoint.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(e) {
      rightPanelScroll = document.getElementById("js-gantt-timeline-cell");
      barsArea = document.getElementById("js-gantt-bars-area");
      startX = e.clientX + rightPanelScroll.scrollLeft;
      startY = e.clientY + rightPanelScroll.scrollTop;

      const linksArea = that.element.querySelector("#js-gantt-links-area");

      if (!linkDirection) {
        linkDirection = document.createElement("div");
        linkDirection.classList.add("js-gantt-link-direction");
        linksArea.append(linkDirection);
      } else {
        linkDirection.style.width = `0px`;
        linksArea.append(linkDirection);
      }

      barsArea.classList.add("js-gantt-link-streching");
      source.classList.add("source");

      document.addEventListener("mousemove", strechLink, false);
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp() {
      autoScroll = false;
      document.removeEventListener("mousemove", strechLink, false);
      document.removeEventListener("mouseup", handleMouseUp, false);

      const selectedTarget = that.element.querySelector(".selected-target");
      if (selectedTarget) {
        selectedTarget.classList.remove("selected-target");
      }

      barsArea.classList.remove("js-gantt-link-streching");
      source.classList.remove("source");

      if (strech) {
        linkDirection.remove();
        const linkType =
          type === "left" && targetType === "left"
            ? 1
            : type === "right" && targetType === "right"
              ? 2
              : type === "left" && targetType === "right"
                ? 3
                : 0;
        const isLinkExist = that.options.links.some(
          (obj) =>
            obj.source == sourceId &&
            obj.target == targetId &&
            obj.type == linkType
        );

        targetId = isNaN(targetId) || targetId === null ? targetId : +targetId;

        const hasCycle = that.hasCycle(sourceId, targetId);

        // handle custom event
        that.dispatchEvent("onBeforeLinkAdd", {
          sourceId,
          targetId,
          type: linkType,
        });

        if (that.eventValue === false) {
          that.eventValue = true;
          return;
        }

        if (
          targetId !== undefined &&
          targetId !== null &&
          targetId != sourceId &&
          !isLinkExist &&
          !hasCycle
        ) {
          const link = {
            id: `${linkType}-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            type: linkType,
          };

          // Use LinkManager to add link if available
          try {
            if (that.#linkManager) {
              that.#linkManager.addLink(link);
            }
          } catch (e) {
            // Link may already exist or create cycle - handled by validation above
            console.warn("LinkManager:", e.message);
          }

          that.createLinks(sourceId, targetId, link);
          that.options.links.push(link);

          // handle custom event
          that.dispatchEvent("onLinkAdd", { link });
        }
      }
      strech = false;
    }

    function strechLink(e) {
      strech = true;

      linkDirection.style.left = `${
        type === "right"
          ? source.offsetLeft + source.offsetWidth
          : source.offsetLeft
      }px`;
      linkDirection.style.top = `${source.offsetTop + source.offsetHeight / 2}px`;
      const base = Math.abs(
        e.clientX -
        (startX -
          (type === "left" && e.clientX - startX > 0
            ? -20
            : type === "left" && e.clientX - startX < 0
              ? 0
              : e.clientX - startX > 0
                ? 0
                : 20) -
          rightPanelScroll.scrollLeft)
      );
      const perp = Math.abs(e.clientY - (startY - rightPanelScroll.scrollTop));
      const hypo = Math.sqrt(base * base + perp * perp);
      linkDirection.style.width = `${hypo}px`;

      const scrollSpeed = 5;

      function startAutoScroll(type) {
        if (type === "right") {
          rightPanelScroll.scrollLeft += scrollSpeed;
          if (
            rightPanelScroll.scrollLeft >=
            rightPanelScroll.scrollWidth - rightPanelScroll.clientWidth
          ) {
            autoScroll = false;
            return;
          }
        } else if (type === "left") {
          rightPanelScroll.scrollLeft -= scrollSpeed;
          if (rightPanelScroll.scrollLeft <= 0) {
            autoScroll = false;
            return;
          }
        } else if (type === "top") {
          rightPanelScroll.scrollTop += scrollSpeed;
          if (rightPanelScroll.scrollTop <= 0) {
            autoScroll = false;
            return;
          }
        } else if (type === "bottom") {
          rightPanelScroll.scrollTop -= scrollSpeed;
          if (
            rightPanelScroll.scrollTop >=
            rightPanelScroll.scrollHeight - rightPanelScroll.clientHeight
          ) {
            autoScroll = false;
            return;
          }
        }
        if (autoScroll) {
          setTimeout(() => {
            startAutoScroll(type);
          }, 50); // Adjust the scroll delay by changing the value here
        }
      }

      const scrollContainer =
        that.element.offsetLeft + rightPanelScroll.offsetLeft;
      const scrollThresholdRight =
        scrollContainer + rightPanelScroll.offsetWidth - 30;
      const scrollThresholdLeft = scrollContainer + 30;

      // auto scroll the div left and right
      if (e.clientX > scrollThresholdRight - window.scrollX) {
        autoScroll = true;
        startAutoScroll("right");
      } else if (e.clientX < scrollThresholdLeft - window.scrollX) {
        autoScroll = true;
        startAutoScroll("left");
      } else {
        autoScroll = false;
      }

      const scrollContainerTop =
        that.element.offsetTop + rightPanelScroll.offsetHeight;
      const scrollThresholdTop = scrollContainerTop - 30;
      const scrollThresholdBottom =
        that.element.offsetTop + that.calculateScaleHeight("scroll") + 30;

      // auto scroll the div top and bottom
      if (e.clientY > scrollThresholdTop - window.scrollY) {
        autoScroll = true;
        startAutoScroll("top");
      } else if (e.clientY < scrollThresholdBottom - window.scrollY) {
        autoScroll = true;
        startAutoScroll("bottom");
      }

      // Retrieve the mouse coordinates from the event
      const mouseX = e.pageX;
      const mouseY = e.pageY;

      // Calculate the differences between the mouse coordinates and the point coordinates
      const deltaX =
        mouseX -
        (startX -
          (type === "left" ? -20 : 20) -
          rightPanelScroll.scrollLeft +
          window.scrollX);
      const deltaY =
        mouseY - (startY - rightPanelScroll.scrollTop + window.scrollY);

      // Calculate the angle in radians
      const radians = Math.atan2(deltaY, deltaX);
      linkDirection.style.transform = `rotate(${radians}rad)`;
      if (e.target.classList.contains("js-gantt-link-point")) {
        targetId = e.target.parentElement.parentElement.getAttribute(
          "js-gantt-taskbar-id"
        );
        targetType = e.target.parentElement.classList.contains(
          "js-gantt-left-point"
        )
          ? "left"
          : "right";
        if (targetId != sourceId) {
          e.target.classList.add("selected-target");
        }
      } else {
        targetId = null;
        targetType = undefined;
        const selectedTarget = that.element.querySelector(".selected-target");
        if (selectedTarget !== undefined && selectedTarget !== null) {
          selectedTarget.classList.remove("selected-target");
        }
      }
    }
  }

  // Method to show loader
  showLoader() {
    const jsLoader = document.createElement("span");
    const jsLoaderDrop = document.createElement("div");

    jsLoader.id = "js-gantt-loader";
    jsLoader.classList.add("js-gantt-loader");
    jsLoaderDrop.classList.add("js-gantt-loader-drop");

    document.body.append(jsLoaderDrop, jsLoader);
  }

  // method to hide loader
  hideLoader() {
    const jsLoader = document.querySelector("#js-gantt-loader");
    const jsLoaderDrop = document.querySelector(".js-gantt-loader-drop");

    if (jsLoader) {
      jsLoader.remove();
    }

    if (jsLoaderDrop) {
      jsLoaderDrop.remove();
    }
  }

  // method to initialize zoom options
  zoomInit(type = "after") {
    const zoomLevels = this.options.zoomConfig;
    for (const levels of zoomLevels.levels) {
      if (this.options.zoomLevel == levels.name) {
        this.options.scale_height =
          levels.scale_height || this.options.scale_height;
        this.options.minColWidth =
          levels.min_col_width || this.options.minColWidth;
        this.options.scales = levels.scales;
        break;
      }
    }

    if (type !== "initial") {
      this.render();
    }
  }

  // method to get the number of days in  a month of a date
  getDaysInMonth(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return daysInMonth;
  }

  // method to get the days in quarter of a date
  getDaysInQuarter(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    const quarterStartMonth = Math.floor(month / 3) * 3;
    const quarterStartDate = new Date(year, quarterStartMonth, 1);
    const quarterEndDate = new Date(year, quarterStartMonth + 3, 0);

    const daysInQuarter =
      (quarterEndDate - quarterStartDate) / (1000 * 60 * 60 * 24) + 1;

    return daysInQuarter;
  }

  // method to get the quarter of a date
  getQuarterOfDate(date) {
    date = new Date(date);
    // Get the month from the date (0-11)
    const month = date.getMonth();
    // Calculate the quarter
    const quarter = Math.floor(month / 3) + 1;
    return quarter;
  }

  // method to get the current zoom level scale
  getScale() {
    return {
      unit: this.options.zoomLevel,
      step: 1,
      startDate: this.options.startDate,
      endDate: this.options.endDate,
    };
  }

  /**
   * Method to select an area on the Gantt chart by dragging the mouse.
   * @param {HTMLElement} timeLine - The timeline element.
   */
  selectAreaOnDrag(timeLine) {
    let startX,
      taskBarArea,
      hasMoved = false,
      taskArea,
      taskStartDate,
      taskEndDate,
      that = this,
      taskParent,
      end_date,
      timelineContainer,
      autoScroll = false,
      scrollSpeed = 5;

    timeLine.removeEventListener("mousedown", handleMouseDown);
    timeLine.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(e) {
      if (
        that.options.mouseScroll &&
        that.options.ctrlKeyRequiredForMouseScroll &&
        e.ctrlKey
      ) {
        return;
      }
      taskBarArea = that.element.querySelector("#js-gantt-bars-area");
      timelineContainer = that.element.querySelector("#js-gantt-timeline-cell");
      startX =
        e.clientX + timelineContainer.scrollLeft - that.element.offsetLeft;
      const classesToCheck = ["js-gantt-task-row", "js-gantt-task-cell"];

      let isClassPresent = false;
      for (let i = 0; i < classesToCheck.length; i++) {
        if (e.target.classList.contains(classesToCheck[i])) {
          isClassPresent = true;
          break;
        }
      }
      if (isClassPresent === false) {
        return;
      }

      let taskAreaRow;
      if (e.target.classList.contains("js-gantt-task-row")) {
        taskAreaRow = e.target;
      } else {
        taskAreaRow = e.target.parentElement;
      }

      taskArea = document.createElement("div");
      taskArea.id = "task-area";
      taskArea.classList.add("task-area");
      taskArea.style.top = `${taskAreaRow.offsetTop}px`;
      taskArea.style.left = `${
        e.clientX - timeLine.offsetLeft + timelineContainer.scrollLeft
      }px`;
      taskArea.style.height = `${taskAreaRow.offsetHeight}px`;

      const allTaskBars = taskBarArea.querySelectorAll(".js-gantt-bar-task");
      taskParent = allTaskBars[
        Math.floor(taskAreaRow.offsetTop / taskAreaRow.offsetHeight)
        ].getAttribute("js-gantt-taskbar-id");
      const parentTask = that.getTask(taskParent);
      if (that.hasProperty(parentTask, "end_date")) {
        end_date = parentTask.start_date;
      }
      if (parentTask.children && parentTask.children.length) {
        end_date = that.getStartAndEndDate(parentTask.children).endDate;
      }

      document.addEventListener("mousemove", createTaskArea, false);
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp(e) {
      document.removeEventListener("mousemove", createTaskArea, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      if (startX === e.clientX) {
        hasMoved = false;
        return;
      }
      if (hasMoved === true) {
        taskStartDate =
          that.dates[
            Math.floor(
              (taskArea.offsetLeft < 0 ? 0 : taskArea.offsetLeft) /
              that.calculateGridWidth(end_date, "day")
            )
            ];

        const isAtLastCol =
          that.calculateTimeLineWidth("current") <
          taskArea.offsetLeft + taskArea.offsetWidth;
        let dateIndex;
        if (!isAtLastCol) {
          dateIndex = Math.floor(
            (taskArea.offsetLeft + taskArea.offsetWidth) /
            that.calculateGridWidth(end_date, "day")
          );
        } else {
          dateIndex = that.dates.length - 1;
        }
        taskEndDate = that.dates[dateIndex];

        if (taskArea) {
          taskArea.remove();
        }
        const task = {
          startDate: new Date(taskStartDate),
          endDate: new Date(taskEndDate),
          parent: isNaN(taskParent) ? taskParent : +taskParent,
        };
        // handle custom event
        that.dispatchEvent("selectAreaOnDrag", { task });
      }
      hasMoved = false;
    }

    function createTaskArea(e) {
      hasMoved = true;

      if (
        e.clientX + timelineContainer.scrollLeft - that.element.offsetLeft <
        startX
      ) {
        taskArea.style.left = `${
          e.clientX -
          timeLine.offsetLeft +
          timelineContainer.scrollLeft -
          that.element.offsetLeft
        }px`;
        taskArea.style.width = `${
          startX -
          (e.clientX - that.element.offsetLeft) -
          timelineContainer.scrollLeft
        }px`;
      } else {
        taskArea.style.left = `${startX - timeLine.offsetLeft}px`;
        taskArea.style.width = `${
          e.clientX -
          startX +
          timelineContainer.scrollLeft -
          that.element.offsetLeft
        }px`;
      }
      const isTaskAreaExist = that.element.querySelector("#task-area");
      if (!isTaskAreaExist) {
        if (startX !== e.clientX) {
          taskBarArea.append(taskArea);
        }
      }

      function startAutoScroll(type) {
        if (type === "right") {
          timelineContainer.scrollLeft += scrollSpeed;
          if (
            timelineContainer.scrollLeft >=
            timelineContainer.scrollWidth - timelineContainer.clientWidth
          ) {
            autoScroll = false;
            return;
          }
        } else if (type === "left") {
          timelineContainer.scrollLeft -= scrollSpeed;
          if (timelineContainer.scrollLeft <= 0) {
            autoScroll = false;
            return;
          }
        }
        if (autoScroll) {
          setTimeout(() => {
            startAutoScroll(type);
          }, 50); // Adjust the scroll delay by changing the value here
        }
      }

      const scrollContainer =
        that.element.offsetLeft + timelineContainer.offsetLeft;
      const scrollThresholdRight =
        scrollContainer + timelineContainer.offsetWidth - 30;
      const scrollThresholdLeft = scrollContainer + 30;

      // auto scroll the div left and right
      if (e.clientX > scrollThresholdRight - window.scrollX) {
        autoScroll = true;
        startAutoScroll("right");
      } else if (e.clientX < scrollThresholdLeft - window.scrollX) {
        autoScroll = true;
        startAutoScroll("left");
      } else {
        autoScroll = false;
      }
    }
  }

  /**
   * Method to handle dragging of the task progress bar.
   * @param {HTMLElement} resizer - The resizer element used to drag the progress.
   * @param {HTMLElement} progress - The progress bar element.
   * @param {HTMLElement} taskBar - The task bar element.
   * @param {Object} task - The task data object.
   */
  dragTaskProgress(resizer, progress, taskBar, task) {
    let startX,
      dragging = false,
      that = this,
      autoScroll = false,
      timeLineContainer,
      scrollSpeed = 5,
      startProgressWidth;

    resizer.removeEventListener("mousedown", handleMouseDown);
    resizer.addEventListener("mousedown", handleMouseDown);

    function handleMouseDown(e) {
      startProgressWidth = progress.offsetWidth;
      timeLineContainer = that.element.querySelector("#js-gantt-timeline-cell");
      startX = e.clientX + timeLineContainer.scrollLeft;

      document.addEventListener("mousemove", resize, false);
      document.addEventListener("mouseup", handleMouseUp, false);
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", resize, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      if (dragging === true) {
        const progressPer = Math.round(
          (progress.offsetWidth / taskBar.offsetWidth) * 100
        );
        progress.style.width = `${progressPer}%`;
        resizer.style.left = `${progressPer}%`;

        task.progress = progressPer;
        that.originalData.findIndex((item) => {
          if (item.id == task.id) {
            item.progress = progressPer;
          }
        });
        // handle custom event
        that.dispatchEvent("onAfterProgressDrag", { task });
      }
      dragging = false;
    }

    function resize(e) {
      that.dispatchEvent("onBeforeProgressDrag", { task });

      // if onBeforeProgressDrag return false then do not drag the Progress
      if (that.eventValue === false) {
        return;
      }

      dragging = true;
      let progressWidth =
        startProgressWidth +
        (e.clientX - startX) +
        timeLineContainer.scrollLeft;

      progressWidth =
        progressWidth > taskBar.offsetWidth
          ? taskBar.offsetWidth
          : progressWidth < 0
            ? 0
            : progressWidth;

      progress.style.width = `${progressWidth}px`;
      resizer.style.left = `${progressWidth}px`;

      // function for auto scroll
      function startAutoScroll(type) {
        if (type === "right") {
          timeLineContainer.scrollLeft += scrollSpeed;
          if (
            timeLineContainer.scrollLeft >=
            timeLineContainer.scrollWidth - timeLineContainer.clientWidth
          ) {
            autoScroll = false;
            return;
          }
        } else if (type === "left") {
          timeLineContainer.scrollLeft -= scrollSpeed;
          if (timeLineContainer.scrollLeft <= 0) {
            autoScroll = false;
            return;
          }
        }
        if (autoScroll) {
          setTimeout(() => {
            startAutoScroll(type);
          }, 50);
        }
      }

      const scrollContainer =
        that.element.offsetLeft + timeLineContainer.offsetLeft;
      const scrollThresholdRight =
        scrollContainer + timeLineContainer.offsetWidth - 30;
      const scrollThresholdLeft = scrollContainer + 30;

      // auto scroll the div left and right
      if (e.clientX > scrollThresholdRight - window.scrollX) {
        autoScroll = true;
        startAutoScroll("right");
      } else if (e.clientX < scrollThresholdLeft - window.scrollX) {
        autoScroll = true;
        startAutoScroll("left");
      } else {
        autoScroll = false;
      }
    }
  }

  /**
   * Updates the body of the Gantt chart.
   */
  updateBody() {
    this.verScroll =
      this.element.querySelector(".js-gantt-ver-scroll")?.scrollTop || 0;
    this.horScroll =
      this.element.querySelector(".js-gantt-hor-scroll")?.scrollLeft || 0;

    const timeline = document.getElementById("js-gantt-timeline-cell");
    const ganttLayout = this.element.querySelector(".js-gantt-layout");
    timeline.innerHTML = "";
    this.createTimelineScale(timeline);
    this.createTimelineBody(timeline, ganttLayout);
  }

  /**
   * Automatically schedules tasks based on their dependencies.
   */
  autoScheduling() {
    const { links } = this.options;
    const linksLength = links?.length;
    for (let i = 0; i < linksLength; i++) {
      const link = this.options.links[i];

      if (!link) {
        return;
      }

      const source = this.element.querySelector(
        `[js-gantt-taskbar-id="${link.source}"]`
      );

      const target = this.element.querySelector(
        `[js-gantt-taskbar-id="${link.target}"]`
      );

      if (!source || !target) {
        continue;
      }

      const sourceLeft = source.offsetLeft,
        sourceWidth = source.offsetWidth,
        targetLeft = target.offsetLeft,
        targetWidth = target.offsetWidth;

      switch (link.type) {
        case 1:
          if (targetLeft < sourceLeft) {
            target.style.left = `${sourceLeft}px`;
          }
          break;
        case 2:
          if (targetLeft + targetWidth < sourceLeft + sourceWidth) {
            target.style.left = `${
              targetLeft +
              (sourceLeft + sourceWidth - (targetLeft + targetWidth))
            }px`;
          }
          break;
        case 3:
          if (targetLeft + targetWidth < sourceLeft) {
            target.style.left = `${sourceLeft - targetWidth}px`;
          }
          break;
        case 0:
          if (targetLeft < sourceLeft + sourceWidth) {
            target.style.left = `${sourceLeft + sourceWidth}px`;
          }
          break;
      }

      const task = this.getTask(link.target);
      const taskStartDate = this.calculateTaskStartDate(target, task);
      const taskEndDate = this.calculateTaskEndDate(target, task);

      this.#updateTask(task, taskStartDate, taskEndDate, target);

      this.dispatchEvent("onAutoScheduling", { task });
    }
  }

  // calculateTaskStartDate by element
  calculateTaskStartDate(target, task) {
    const dateDiff = Math.round(
      target.offsetLeft / this.calculateGridWidth(task.start_date, "day")
    );

    let taskStartDate =
      this.dates[dateDiff - (task.type === "milestone" ? 1 : 0)];

    // if taskStartDate is less than the gantt range
    if (!taskStartDate) {
      taskStartDate = this.add(new Date(this.dates[0]), dateDiff, "day");
    }
    return taskStartDate;
  }

  // calculateTaskEndDate by element
  calculateTaskEndDate(target, task) {
    let taskEndDate =
      this.dates[
      Math.round(
        (target.offsetLeft + target.offsetWidth) /
        this.calculateGridWidth(task.start_date, "day")
      ) - 1
        ];

    // if taskEndDate is greater than the gantt range
    if (!taskEndDate) {
      const dateDiff =
        Math.round(
          (target.offsetLeft + target.offsetWidth) /
          this.calculateGridWidth(task.start_date, "day")
        ) - this.dates.length;
      taskEndDate = this.add(
        new Date(this.dates[this.dates.length - 1]),
        dateDiff,
        "day"
      );
    }
    return taskEndDate;
  }

  /**
   * Checks if there is a cycle in the task dependencies, starting from the given source and target tasks.
   * also checks for the parent child relation.
   *
   * @param {string | number} currentSource - The ID of the current source task.
   * @param {string | number} currentTarget - The ID of the current target task.
   * @param {string | number} [linkId=""] - The ID of the link being checked (optional).
   * @returns {boolean} - Returns true if a cycle is detected, false otherwise.
   */
  hasCycle(currentSource, currentTarget, linkId = "") {
    if (!currentTarget) {
      return false;
    }

    if (currentSource == currentTarget) {
      return true;
    }

    // Use LinkManager's wouldCreateCycle for basic check
    if (this.#linkManager && this.#linkManager.wouldCreateCycle(currentSource, currentTarget)) {
      return true;
    }

    const currentTargetTask = this.getTask(currentTarget);

    if (currentTargetTask?.parent == currentSource) {
      return true;
    }

    const currentSourceTask = this.getTask(currentSource);

    if (
      (currentSourceTask?.children?.length &&
        findTask(currentSourceTask, currentTarget)) ||
      (currentTargetTask?.children?.length &&
        findTask(currentTargetTask, currentSource))
    ) {
      return true;
    }

    // check is child or parent
    function findTask(parentTask, targetId) {
      if (!parentTask?.children?.length) {
        return false;
      }

      for (const task of parentTask.children) {
        if (task?.id == targetId) {
          return true;
        } else if (task?.children?.length) {
          return findTask(task, targetId);
        }
      }
      return false;
    }

    const filteredLinks = this.options.links.filter(
      (link) => link.target == currentSource && link.id != linkId
    );
    if (!filteredLinks?.length) {
      return false;
    }

    for (const link of filteredLinks) {
      if (
        link.source === currentTarget ||
        this.hasCycle(link?.source, currentTarget, link?.id)
      ) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  /**
   * Method to throw error.
   * @param {string} error - error message
   */
  throwError(error) {
    throw new Error(error);
  }

  /**
   * Displays a toast notification with a specified title, message, and type.
   * The toast can be dismissed by clicking on it or automatically after a delay.
   *
   * @param {string|null} title - The title of the toast notification (optional).
   * @param {string} message - The message of the toast notification.
   * @param {string} type - The type of the toast notification, used for styling.
   */
  toastr(title = null, message, type) {
    let toastrArea = document.querySelector(".js-gantt-toastr-area");
    if (!toastrArea) {
      toastrArea = document.createElement("div");
      toastrArea.classList.add("js-gantt-toastr-area");
      document.body.append(toastrArea);
    }

    const newToastr = document.createElement("div");
    newToastr.classList.add("js-gantt-toastr", `js-gantt-toastr-${type}`);
    const titleDiv = document.createElement("p");
    const messageDiv = document.createElement("p");
    messageDiv.innerHTML = message;
    if (title) {
      titleDiv.innerHTML = title;
      newToastr.append(titleDiv);
    }

    newToastr.append(messageDiv);
    newToastr.classList.add("js-gantt-toastr-show");

    toastrArea.append(newToastr);

    const removeToastr = () => {
      newToastr.classList.remove("js-gantt-toastr-show");
      newToastr.classList.add("js-gantt-toastr-hide");
      setTimeout(() => {
        newToastr.remove();
      }, 500);
    };

    let removeTimer = setTimeout(removeToastr, 3000);

    newToastr.addEventListener("click", () => {
      clearTimeout(removeTimer);
      removeToastr();
    });

    newToastr.addEventListener("mouseenter", () => {
      clearTimeout(removeTimer); // Clear the timeout when mouse enters
    });

    newToastr.addEventListener("mouseleave", () => {
      removeTimer = setTimeout(removeToastr, 3000); // Start the timeout again when mouse leaves
    });
  }

  /**
   * method to convert dateString to date object on based on date_format
   * @param {string} dateString - Date string
   * @returns returns the date object converted from datestring based on date_format
   */
  getDateTimeComponents(dateString) {
    if (!dateString) {
      return;
    }
    const formatString = this.options.date_format;
    const formatMap = {
      "%d": "day", // day with leading zero
      "%j": "day", // day without leading zero
      "%m": "month", // month with leading zero
      "%n": "month", // month without leading zero
      "%Y": "year", // four-digit year
      "%y": "year", // two-digit year
      "%H": "hour", // hour (24-hour clock) with leading zero
      "%G": "hour", // hour (24-hour clock) without leading zero
      "%h": "hour", // hour (12-hour clock) with leading zero
      "%g": "hour", // hour (12-hour clock) without leading zero
      "%i": "minute", // minutes with leading zero
      "%s": "second", // seconds with leading zero
      "%a": "amPm", // am/pm
      "%A": "amPm", // AM/PM
    };
    // M, F, W, l, D,

    const regexMap = {
      "%d": "(\\d{2})",
      "%j": "(\\d{1,2})",
      "%m": "(\\d{2})",
      "%n": "(\\d{1,2})",
      "%Y": "(\\d{4})",
      "%y": "(\\d{2})",
      "%H": "(\\d{2})",
      "%G": "(\\d{1,2})",
      "%h": "(\\d{2})",
      "%g": "(\\d{1,2})",
      "%i": "(\\d{2})",
      "%s": "(\\d{2})",
      "%a": "(am|pm)",
      "%A": "(AM|PM)",
    };

    // Build the regex pattern based on the format string
    let regexPattern = formatString;
    for (const [format, regex] of Object.entries(regexMap)) {
      regexPattern = regexPattern.replace(format, regex);
    }

    const regex = new RegExp(regexPattern);
    const matches = dateString.match(regex);

    if (!matches) {
      throw new Error(
        `The date string "${dateString}" does not match the format string "${formatString}".`
      );
    }

    const dateComponents = {
      day: "01",
      month: "01",
      year: "1970",
      hour: "00",
      minute: "00",
      second: "00",
      amPm: "AM",
    };

    // Extract components based on the input format
    let matchIndex = 1;
    for (const part of formatString.match(/%[a-zA-Z]/g)) {
      if (formatMap[part]) {
        dateComponents[formatMap[part]] = matches[matchIndex++];
      }
    }

    // Convert components to appropriate values
    const day = parseInt(dateComponents.day, 10);
    const month = parseInt(dateComponents.month, 10) - 1; // JavaScript months are 0-based
    const year =
      dateComponents.year.length === 2
        ? (parseInt(dateComponents.year, 10) < 50 ? "20" : "19") +
        dateComponents.year
        : parseInt(dateComponents.year, 10);
    const hour = parseInt(dateComponents.hour, 10);
    const minute = parseInt(dateComponents.minute, 10);
    const second = parseInt(dateComponents.second, 10);

    // Adjust for 12-hour clock if necessary
    let finalHour = hour;
    if (formatString.includes("%h") || formatString.includes("%g")) {
      if (dateComponents.amPm.toLowerCase() === "pm" && hour < 12) {
        finalHour += 12;
      }
      if (dateComponents.amPm.toLowerCase() === "am" && hour === 12) {
        finalHour = 0;
      }
    }

    // Create a Date object
    const dateObject = new Date(year, month, day, finalHour, minute, second);

    return dateObject;
  }

  /**
   * Adds event listeners to a color input to change the color of a taskbar,
   * task progress, and taskbar content. Dispatches a custom event when the color changes.
   *
   * @param {HTMLElement} taskbar - The taskbar element to change the color of.
   * @param {HTMLInputElement} colorInput - The color input element.
   * @param {HTMLElement} taskProgress - The task progress element to change the color of.
   * @param {HTMLElement} taskbarContent - The taskbar content element to change the color of.
   * @param {Object} task - The task object associated with the taskbar.
   */
  changeTaskbarColor(taskbar, colorInput, taskProgress, taskbarContent, task) {
    const applyColors = (color) => {
      if (taskProgress) {
        taskProgress.style.setProperty("background-color", color, "important");
      }

      if (task.type === "milestone") {
        taskbarContent.style.setProperty(
          "background-color",
          color,
          "important"
        );
        taskbarContent.style.setProperty("border-color", color, "important");
      } else {
        const taskColor = taskProgress ? this.changeOpacity(color) : color;
        taskbar.style.setProperty("background-color", taskColor, "important");
        taskbar.style.setProperty("border-color", color, "important");
      }
    };

    const debouncedHandleColorChange = this.debounce(
      "changeColorTimer",
      (e) => {
        const color = e.target.value;
        applyColors(color);
        setColorToOriginalData(color);
        this.dispatchEvent("onColorChange", { taskColor: color, task });
      },
      20
    );

    colorInput.addEventListener("change", debouncedHandleColorChange);
    colorInput.addEventListener("input", debouncedHandleColorChange);

    const setColorToOriginalData = (color) => {
      task.taskColor = color;
      const taskIndex = this.originalData.findIndex(
        (item) => item.id == task.id
      );
      if (taskIndex !== -1) {
        this.originalData[taskIndex].taskColor = color;
      }
    };
  }

  changeOpacity(color) {
    const opacity = this.options.taskOpacity;
    const tempElement = document.createElement("div");
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    const computedColor = window.getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);

    const rgbaColor = computedColor
      .replace("rgb", "rgba")
      .replace(")", `,${opacity})`);
    return rgbaColor;
  }

  // Function to convert RGBA to HEX
  rgbaToHex(rgbaColor) {
    if (rgbaColor) {
      const rgbaArray = rgbaColor.match(/\d+/g);
      const hexValue = `#${`0${parseInt(rgbaArray[0], 10).toString(16)}`.slice(
        -2
      )}${`0${parseInt(rgbaArray[1], 10).toString(16)}`.slice(
        -2
      )}${`0${parseInt(rgbaArray[2], 10).toString(16)}`.slice(-2)}`;
      return hexValue;
    }
    return false;
  }

  /**
   * Method to set the local language to the gantt.
   * @param { string } language - language code.
   */
  setLocalLang(language) {
    this.options.localLang = language;
    this.options.currentLanguage = this.options.i18n[language];
    this.updateBody();
  }

  /**
   * Checks if the source and target elements exist and are not hidden.
   *
   * @param {HTMLElement | null} source - The source element to check.
   * @param {HTMLElement | null} target - The target element to check.
   * @returns {boolean} - Returns true if both elements exist and are not hidden, false otherwise.
   */
  isTaskExistOrHidden(source, target) {
    const sourceStyle = source ? window.getComputedStyle(source) : null;
    const targetStyle = target ? window.getComputedStyle(target) : null;

    const isSourceHidden = sourceStyle ? sourceStyle.display === "none" : false;
    const isTargetHidden = targetStyle ? targetStyle.display === "none" : false;

    if (
      source === undefined ||
      source === null ||
      target === undefined ||
      target === null ||
      source === target ||
      isTargetHidden ||
      isSourceHidden
    ) {
      return false;
    } else {
      return true;
    }
  }

  createSplitTask(barContainer = null, isFromRender = false) {
    const rowCount = 0;

    const jsGanttBarsArea = document.createElement("div");
    jsGanttBarsArea.classList.add("js-gantt-bars-area");
    jsGanttBarsArea.id = "js-gantt-bars-area";

    const tasksData = [];

    function getUniqueObjects(data) {
      const tasksArray = [];
      for (let i = 0; i < data.length; i++) {
        const task = data[i];

        if (tasksArray.length == 0) {
          tasksArray.push(task);
        } else {
          let flag = false;
          for (let j = 0; j < tasksArray.length; j++) {
            if (
              new Date(tasksArray[j].start_date).getTime() ===
              new Date(task.start_date).getTime() &&
              new Date(tasksArray[j].end_date).getTime() ===
              new Date(task.end_date).getTime()
            ) {
              flag = true;
              tasksArray[j] = task;
              break;
            }
          }
          if (!flag) {
            tasksArray.push(task);
          }
        }
        if (data[i].children) {
          getUniqueObjects(data[i].children);
        }
      }
      return tasksArray;
    }

    for (let i = 0; i < this.options.data.length; i++) {
      if (this.options.data[i].children) {
        const tasks = getUniqueObjects(this.options.data[i].children);
        tasksData.push(tasks);
      }
    }

    for (let j = 0; j < tasksData.length; j++) {
      for (let k = 0; k < tasksData[j].length; k++) {
        const task = tasksData[j][k];

        if (this.isTaskNotInSearchedData(task.id)) {
          continue;
        }

        let { start_date } = task;
        let end_date = task.end_date || task.start_date;

        if (task.children && task.children.length > 0) {
          const data = [...task.children];
          const startAndEndDate = this.getStartAndEndDate(data);
          const start = startAndEndDate.startDate;
          const end = startAndEndDate.endDate;

          const setDate = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
          };

          const dates = [
            setDate(start_date || start),
            setDate(start),
            setDate(end_date || end),
            setDate(end),
          ];

          start_date = new Date(Math.min(...dates));
          end_date = new Date(Math.max(...dates));
        }

        const cellStartDate = this.options.startDate;
        let isCellGreater = true;
        let cellBefore = this.getDates(cellStartDate, start_date);

        if (cellBefore.length === 0) {
          cellBefore = this.getDates(start_date, cellStartDate);
          isCellGreater = false;
        }

        if (isCellGreater) {
          cellBefore = cellBefore.length - 1;
        } else {
          cellBefore = -(cellBefore.length - 1);
        }
        const jsGanttBarTask = document.createElement("div");

        if (task.taskColor && task.type !== "milestone") {
          jsGanttBarTask.style.setProperty(
            "background-color",
            this.changeOpacity(task.taskColor),
            "important"
          );
          jsGanttBarTask.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        if (task.type === "milestone") {
          jsGanttBarTask.classList.add(
            "js-gantt-bar-task",
            "js-gantt-bar-milestone",
            this.options.selectedTask === `${task.id}`
              ? "js-gantt-selected-task-bar"
              : "js-gantt-bar-milestone"
          );
        } else {
          jsGanttBarTask.classList.add(
            "js-gantt-bar-task",
            "js-gantt-bar-parent-task",
            this.options.selectedTask === `${task.id}`
              ? "js-gantt-selected-task-bar"
              : "js-gantt-bar-task"
          );
        }

        //add custom class from user
        this.addClassesFromFunction(
          this.templates.task_class,
          jsGanttBarTask,
          task.start_date,
          task.end_date,
          task
        );

        jsGanttBarTask.setAttribute("task-parent", j);
        jsGanttBarTask.setAttribute("data-task-pos", 0);
        jsGanttBarTask.setAttribute("js-gantt-taskbar-id", task.id);

        let taskLeft = cellBefore * this.calculateGridWidth(start_date, "day");

        const hourLeft = this.getPxByTime(start_date, "left");
        taskLeft += hourLeft;

        jsGanttBarTask.style.left = `${taskLeft}px`;

        jsGanttBarTask.style.top = `${
          rowCount * this.options.row_height +
          Math.floor((this.options.row_height * 10) / 100)
        }px`;
        const barTaskHeight = Math.floor((this.options.row_height * 80) / 100);
        jsGanttBarTask.style.height = `${barTaskHeight}px`;
        jsGanttBarTask.style.lineHeight = `${barTaskHeight}px`;
        if (task.type === "milestone") {
          jsGanttBarTask.style.width = `${barTaskHeight}px`;
          jsGanttBarTask.style.left = `${
            (cellBefore + 1) * this.calculateGridWidth(start_date, "day")
          }px`;
        }

        const jsGanttBarTaskContent = document.createElement("div");
        jsGanttBarTaskContent.classList.add(
          "js-gantt-bar-task-content",
          "parent-task-bar-content"
        );

        if (task.type === "milestone" && task.taskColor) {
          jsGanttBarTaskContent.style.setProperty(
            "background-color",
            task.taskColor,
            "important"
          );

          jsGanttBarTaskContent.style.setProperty(
            "border-color",
            task.taskColor,
            "important"
          );
        }

        const that = this;

        // handle double click event
        jsGanttBarTask.addEventListener("dblclick", handleDblClick);

        function handleDblClick() {
          // custom event handler
          that.dispatchEvent("onBeforeTaskDblClick", { task });

          // if onBeforeTaskDblClick return false then do not drag the task
          if (that.eventValue === false) {
            that.eventValue = true;
            return;
          }

          that.dispatchEvent("onTaskDblClick", { task });

          that.showLightBox(task);
        }

        const { userAgent } = navigator;

        // Handle mouseover event
        jsGanttBarTask.addEventListener("mouseover", handleMouseOver);

        function handleMouseOver() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.add("hovered");
          }

          that.updateTooltipBody(task);
        }

        // Handle mouseleave event
        jsGanttBarTask.addEventListener("mouseleave", handleMouseLeave);

        function handleMouseLeave() {
          if (/^((?!chrome|android).)*safari/i.test(userAgent)) {
            jsGanttBarTask.classList.remove("hovered");
          }

          that.hideTooltip();
        }

        if (
          this.callTemplate("task_drag", "resize", task) &&
          task.type !== "milestone"
        ) {
          // left side resizer
          const jsGanttTaskDragLeft = document.createElement("div");
          jsGanttTaskDragLeft.classList.add("js-gantt-task-drag-left");

          // right side resizer
          const jsGanttTaskDragRight = document.createElement("div");
          jsGanttTaskDragRight.classList.add("js-gantt-task-drag-right");

          jsGanttBarTask.append(jsGanttTaskDragLeft, jsGanttTaskDragRight);
          this.resizeTaskBars(
            jsGanttTaskDragLeft,
            jsGanttBarTask,
            "left",
            task
          );
          this.resizeTaskBars(
            jsGanttTaskDragRight,
            jsGanttBarTask,
            "right",
            task
          );
        }

        const taskDates = this.getDates(start_date, end_date);

        let taskProgress;
        // Using imported isFunction
        const isTaskProgress = isFunction(this.options.taskProgress)
          ? this.options.taskProgress(task)
          : this.options.taskProgress;
        if (isTaskProgress === true && task.type !== "milestone") {
          const progressPer = task.progress || 0;
          const progressWidth = progressPer > 100 ? 100 : progressPer;

          // Using imported createElement utility
          const taskProgressContainer = createElement("div", {
            classes: ["js-gantt-task-progress-wrapper"],
          });
          taskProgress = createElement("div", {
            classes: ["js-gantt-task-progress"],
            styles: { width: `${progressWidth}%` },
          });

          if (task.taskColor) {
            taskProgress.style.setProperty(
              "background-color",
              task.taskColor,
              "important"
            );
          }

          taskProgressContainer.append(taskProgress);

          const taskProgressDrag = document.createElement("div");
          taskProgressDrag.classList.add("js-gantt-task-progress-drag");
          taskProgressDrag.style.left = `${
            progressPer > 100 ? 100 : progressPer
          }%`;

          // update the task progress onAfterTaskUpdate
          this.attachEvent("onAfterTaskUpdate", () => {
            const progress = progressPer > 100 ? 100 : task.progress || 0;
            taskProgress.style.width = `${progress}%`;

            taskProgressDrag.style.left = `${progress}%`;
          });

          jsGanttBarTask.append(taskProgressContainer, taskProgressDrag);
          this.dragTaskProgress(
            taskProgressDrag,
            taskProgress,
            jsGanttBarTask,
            task
          );
        }

        if (this.callTemplate("task_drag", "move", task)) {
          this.resizeTaskBars(
            jsGanttBarTaskContent,
            jsGanttBarTask,
            "move",
            task
          );
        }

        // link control pointers - using imported isFunction
        const isAddLinks = isFunction(this.options.addLinks)
          ? this.options.addLinks(task)
          : this.options.addLinks;

        if (isAddLinks === true) {
          // Using imported createElement utility
          const leftLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-left-point"],
          });
          const leftPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          const rightLinkPoint = createElement("div", {
            classes: ["js-gantt-link-control", "js-gantt-right-point"],
          });
          const rightPoint = createElement("div", {
            classes: ["js-gantt-link-point"],
          });

          leftLinkPoint.append(leftPoint);
          rightLinkPoint.append(rightPoint);
          jsGanttBarTask.append(leftLinkPoint, rightLinkPoint);

          this.createNewLink(rightPoint, jsGanttBarTask, task.id, "right");
          this.createNewLink(leftPoint, jsGanttBarTask, task.id, "left");
        }

        //add custom task color picker - using imported isFunction
        const isCustomColor = isFunction(this.options.taskColor)
          ? this.options.taskColor(task)
          : this.options.taskColor;

        if (isCustomColor) {
          // Using imported createElement utility
          const colorPicker = createElement("div", {
            classes: ["js-gantt-task-color-picker"],
          });
          const colorInput = createElement("input", {
            attributes: { type: "color" },
          });

          setTimeout(() => {
            const backgroundElement =
              task.type === "milestone"
                ? jsGanttBarTaskContent
                : jsGanttBarTask;
            // Get the computed style of the element
            const jsGanttBarTaskStyle =
              window.getComputedStyle(backgroundElement);
            // Get the background-color property value
            const backgroundColor =
              jsGanttBarTaskStyle.getPropertyValue("background-color");
            colorInput.value =
              task.taskColor || this.rgbaToHex(backgroundColor);
          }, 0);

          colorPicker.append(colorInput);
          jsGanttBarTask.append(colorPicker);
          this.changeTaskbarColor(
            jsGanttBarTask,
            colorInput,
            taskProgress,
            jsGanttBarTaskContent,
            task
          );
        }

        if (task.type !== "milestone") {
          let taskWidth =
            taskDates.length * this.calculateGridWidth(end_date, "day");

          if (taskWidth === 0 || !taskWidth) {
            addClass(jsGanttBarTask, "js-gantt-d-none");
          }

          let hourWidth = this.getPxByTime(end_date, "width");
          const hourLeft = this.getPxByTime(start_date, "left");
          hourWidth += hourLeft;
          taskWidth -= hourWidth;

          jsGanttBarTask.style.width = `${taskWidth}px`;
        }

        let sideContent;
        if (task.type === "milestone") {
          sideContent = document.createElement("div");
          sideContent.classList.add("js-gantt-side-content");
          sideContent.innerHTML = this.callTemplate(
            "taskbar_text",
            new Date(task.start_date),
            new Date(task.end_date),
            task
          );
          jsGanttBarTask.append(sideContent);
        } else {
          jsGanttBarTaskContent.innerHTML = this.callTemplate(
            "taskbar_text",
            new Date(task.start_date.setHours(0)),
            new Date(task.end_date.setHours(0)),
            task
          );
        }
        jsGanttBarTask.append(jsGanttBarTaskContent);

        this.attachEvent("onAfterTaskUpdate", () => {
          const innerHTML = this.callTemplate(
            "taskbar_text",
            task.start_date.setHours(0),
            task.end_date.setHours(0),
            task
          );
          if (task.type === "milestone") {
            sideContent.innerHTML = innerHTML;
          } else {
            jsGanttBarTaskContent.innerHTML = innerHTML;
          }
        });

        jsGanttBarsArea.append(jsGanttBarTask);
      }

      const barsArea = document.getElementById("js-gantt-bars-area");

      if (barContainer === null) {
        barContainer = document.getElementById("js-gantt-timeline-data");
      }
      // if barsArea exist then remove barsArea
      if (barsArea && !isFromRender) {
        barsArea.replaceWith(jsGanttBarsArea);
      } else {
        barContainer.append(jsGanttBarsArea);
      }
    }
  }

  /**
   * Method to calculate gantt height.
   * @returns { number } gantt height
   */
  get calculateGanttHeight() {
    let totalGanttHeight = this.calculateScaleHeight("scroll");

    const that = this;
    this.options.data.forEach((task) => {
      totalGanttHeight += this.options.row_height;
      if (this.isTaskOpened(task.id)) {
        totalGanttHeight += calculateVisibleTasksHeight(task);
      }
    });

    function calculateVisibleTasksHeight(task) {
      let childHight = 0;
      if (that.isTaskOpened(task.id)) {
        childHight += task.children.length * that.options.row_height;
        task.children.forEach((child) => {
          childHight += calculateVisibleTasksHeight(child);
        });
      }
      return childHight;
    }

    return totalGanttHeight;
  }

  /**
   * Determines the earliest start date and the latest end date from task data or its children.
   *
   * @param {Object} taskData - The task object.
   * @returns {Object} {start_date, end_date} - An object containing the earliest start date and the latest end date.
   */
  getLargeAndSmallDate(taskData) {
    const { children = [], start_date = null, end_date = null } = taskData;

    let startDate, endDate;
    if (children?.length) {
      const startAndEndDate = this.getStartAndEndDate([...children]);
      ({ startDate, endDate } = startAndEndDate);
    } else {
      startDate = start_date;
      endDate = end_date;
    }

    const setDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const dates = [startDate, endDate, start_date, end_date];
    const filteredDates = dates.filter((date) => date);
    const sanitizedDates = filteredDates.map(setDate);

    const minDate = new Date(Math.min(...sanitizedDates));
    const maxDate = new Date(Math.max(...sanitizedDates));

    return { start_date: minDate, end_date: maxDate };
  }

  /**
   * Adds mouse scroll functionality to the Gantt chart.
   * method to add mouse scroll in gantt with  ctrl+click or with click only,
   * based on this.options.mouseScroll or this.options.ctrlKeyRequiredForMouseScroll
   *
   * @param {HTMLElement} verticalScroll - The vertical scrollbar element.
   * @param {HTMLElement} horizontalScroll - The horizontal scrollbar element.
   */
  addMouseScroll(verticalScroll, horizontalScroll) {
    const timeLine = this.element.querySelector("#js-gantt-timeline-cell");
    timeLine.addEventListener("mousedown", handleMouseDown);
    let startX,
      startY,
      isScrolling = false,
      that = this;

    function handleMouseDown(event) {
      if (
        (that.options.ctrlKeyRequiredForMouseScroll && !event.ctrlKey) ||
        event.target.closest(".js-gantt-bar-task")
      ) {
        return;
      }

      document.addEventListener("mouseup", handleMouseUp, false);
      document.addEventListener("mousemove", scrollTimeline, false);

      startX = event.clientX;
      startY = event.clientY;
      isScrolling = true;
    }

    function handleMouseUp() {
      isScrolling = false;
      document.removeEventListener("mousemove", scrollTimeline, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
    }

    function scrollTimeline(event) {
      if (!isScrolling) {
        return;
      }

      const xScroll = startX - event.clientX;
      const yScroll = startY - event.clientY;

      verticalScroll.scrollTop += yScroll;
      horizontalScroll.scrollLeft += xScroll;

      startX = event.clientX;
      startY = event.clientY;
    }
  }

  /**
   * Sorts the Gantt chart data based on a specified field and sort order.
   *
   * @param {string} sortBy - The field by which the data should be sorted.
   * @param {boolean} isAsc - Indicates whether the sort order is ascending (true) or descending (false).
   */
  sort(sortBy, isAsc) {
    const sortOrderMultiplier = isAsc ? 1 : -1;

    this.originalData.sort((a, b) => {
      let valueA = this.getFieldValue(a, sortBy);
      let valueB = this.getFieldValue(b, sortBy);

      // Handle null values
      if (valueA === null) {
        valueA = ""; // Treat null as an empty string
      }
      if (valueB === null) {
        valueB = ""; // Treat null as an empty string
      }
      valueA = typeof valueA === "string" ? valueA.toLowerCase() : valueA;
      valueB = typeof valueB === "string" ? valueB.toLowerCase() : valueB;
      return (
        (valueA < valueB ? -1 : valueA > valueB ? 1 : 0) * sortOrderMultiplier
      );
    });
    this.render();
  }

  /**
   * Function to safely get the field value from the object,
   * this is a support method for sort method
   * @param { Object } object - Object from which field need to get
   * @param { string } fieldName - field value which need to get
   */
  getFieldValue(object, fieldName) {
    return fieldName
      .split(".")
      .reduce((o, key) => (o && o[key] !== undefined ? o[key] : null), object);
  }

  /**
   * Adds an inline editor to a cell for editing cell data.
   *
   * @param {Object} cellData - The data associated with the cell.
   * @param {Object} editorData - The configuration data for the editor.
   * @param {HTMLElement} cell - The cell element to which the editor is attached.
   * @param {HTMLElement} sidebarDataContainer - The container element for the editor.
   */
  addInlineEditor(cellData, editorData, cell, sidebarDataContainer) {
    const editorWraper = document.createElement("div");
    editorWraper.classList.add("js-gantt-inline-editor-wraper");
    editorWraper.style.cssText = `
        top: ${cell.offsetTop}px;
        left: ${cell.offsetLeft}px;
        height: ${cell.offsetHeight}px;
        width: ${cell.offsetWidth}px;
    `;

    const editor = document.createElement(
      editorData.type === "select" ? "select" : "input"
    );
    editor.type =
      editorData.type === "select" ? editorData.value : editorData.type;
    editor.name = editorData.map_to;

    if (editorData.type === "select") {
      editor.value = cellData[editorData.map_to];
      editorData.options.forEach((option) => {
        const optionElem = document.createElement("option");
        optionElem.innerHTML = option;
        optionElem.value = option;
        editor.appendChild(optionElem);
      });
    } else if (editorData.type === "date") {
      editor.value = this.formatDateToString(
        "%Y-%m-%d",
        cellData[editorData.map_to]
      );
    } else {
      editor.value = cellData[editorData.map_to];
      editor.min = editorData.min;
      editor.max = editorData.max;
    }

    editorWraper.append(editor);

    sidebarDataContainer.append(editorWraper);

    editor.focus();

    editor.addEventListener("blur", () => {
      // handle custom event
      this.dispatchEvent("onBeforeSave", {
        task: cellData,
        columnName: editorData.map_to,
        oldValue: cellData[editorData.map_to],
        newValue: editor.value,
      });

      cellData[editorData.map_to] = editor.value;

      this.updateTaskData(cellData);

      this.removeInlineEditor(editorWraper);
      // handle custom event
      this.dispatchEvent("onSave", {
        task: cellData,
        columnName: editorData.map_to,
        oldValue: cellData[editorData.map_to],
        newValue: editor.value,
      });
    });
  }

  /**
   * Removes an inline editor element from the DOM.
   *
   * @param {HTMLElement} editor - The inline editor element to be removed.
   */
  removeInlineEditor(editor) {
    if (editor) {
      editor.remove();
    }
  }

  /**
   * Creates a debounced version of a function, which delays its execution until after
   * a certain wait time has elapsed without further calls.
   *
   * @param {string} key - The key to strore the debounce function timeout id to clear it.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The time in milliseconds to wait before executing the debounced function.
   * @returns {Function} - Returns the debounced function.
   */
  debounce(key, func, wait) {
    return (...args) => {
      const context = this;
      if (this.#debounceTimers.has(key)) {
        clearTimeout(this.#debounceTimers.get(key));
      }
      const timeoutId = setTimeout(() => func.apply(context, args), wait);
      this.#debounceTimers.set(key, timeoutId);
    };
  }

  /**
   * Checks if a given date is outside the range of the Gantt chart range.
   *
   * @param {Date} date - The date to check.
   * @returns {boolean} - Returns true if the date is outside the Gantt chart range, otherwise false.
   */
  outOfGanttRange(date) {
    const targetDate = this.stripTime(date).getTime();
    const startDate = this.stripTime(this.options.startDate).getTime();
    const endDate = this.stripTime(this.options.endDate).getTime();
    return targetDate < startDate || targetDate > endDate;
  }

  /**
   * Creates a tooltip element if it does not already exist.
   * Attaches necessary event listeners for tooltip positioning.
   */
  createTooltip() {
    // if tooltip exist then return
    if (this.tooltip) {
      return;
    }

    const tooltip = document.createElement("div");
    tooltip.classList.add("js-gantt-tooltip");
    tooltip.id = "js-gantt-tooltip";
    tooltip.style.display = "none";
    document.body.append(tooltip);
    this.tooltip = tooltip;

    this.element.removeEventListener(
      "mousemove",
      this.updateTooltipPosition.bind(this)
    );
    this.element.addEventListener(
      "mousemove",
      this.updateTooltipPosition.bind(this)
    );
  }

  /**
   * Updates the position of the tooltip based on the mouse cursor's coordinates.
   *
   * @param {MouseEvent} e - The mouse event containing cursor coordinates.
   */
  updateTooltipPosition(e) {
    const { tooltip } = this;
    const screenWidth = window.innerWidth;
    const bodyHeight = document.documentElement.clientHeight;

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const MARGIN_X = 10; // Horizontal margin
    const MARGIN_Y = 25; // Vertical margin
    const SCREEN_EDGE_MARGIN = 15; // Screen edge margin

    // Calculate new positions
    let top = e.clientY + MARGIN_Y;
    let left = e.clientX + MARGIN_X;

    // Adjust left position if tooltip goes beyond screen width
    if (left + tooltipWidth > screenWidth - SCREEN_EDGE_MARGIN) {
      left = e.clientX - tooltipWidth;
      if (left < 0) {
        left = 0;
      }
    }

    // Adjust top position if tooltip goes beyond body height
    if (top + tooltipHeight > bodyHeight - SCREEN_EDGE_MARGIN) {
      top = e.clientY - tooltipHeight;
    }

    // Apply the new positions
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  /**
   * Hides the tooltip by clearing its content and setting its display style to 'none'.
   */
  hideTooltip() {
    const { tooltip } = this;

    if (!tooltip) {
      return;
    }

    tooltip.innerHTML = "";
    tooltip.style.display = "none";
  }

  /**
   * method to update tooltip innerHTML
   * @param { Object } task task for tooltip need to update
   */
  updateTooltipBody(task) {
    const { tooltip } = this;

    if (!tooltip) {
      return;
    }

    const { start_date, end_date } = this.getLargeAndSmallDate(task);

    const tooltipContent = this.templates.tooltip_text(
      start_date,
      end_date,
      task
    );

    if (tooltipContent !== false) {
      if (tooltip.innerHTML !== tooltipContent) {
        tooltip.innerHTML = tooltipContent;
        tooltip.style.display = "block";
      }
    } else {
      this.hideTooltip();
    }
  }

  /**
   * Checks if the given value is a function.
   * Uses imported isFunction utility
   * @param {*} value - The value to check.
   * @returns {boolean} - Returns true if the value is a function, otherwise false.
   */
  isFunction(value) {
    return isFunction(value);
  }

  /**
   * Trims leading and trailing whitespace from a class string,
   * replaces multiple spaces with a single space, and adds the resulting classes to the element.
   *
   * @param {HTMLElement} element - The element to which classes will be added.
   * @param {string} classString - A string containing one or more class names, possibly separated by whitespace.
   */
  addClass(element, classString) {
    if (classString) {
      const classes = classString.trim().replace(/\s+/g, " ").split(" ");
      element.classList.add(...classes);
    }
  }

  /**
   * Checks if the specified property of an object is a function, and if so,
   * calls it with the provided parameters. If the function returns a value,
   * trims whitespace, splits the result by spaces, and adds the resulting classes
   * to the specified element's class list.
   * @param {function} func - The function which return the css classes.
   * @param {HTMLElement} element - The HTML element to which classes will be added.
   * @param {...any} params - Parameters to be passed to the function if it exists.
   */
  addClassesFromFunction(func, element, ...params) {
    // Using imported isFunction utility
    if (isFunction(func)) {
      // Call the function with the provided parameters
      const cssClass = func(...params);
      this.addClass(element, cssClass);
    }
  }

  /**
   * Method to filter out weekends if fullWeek option is not enabled.
   *
   * @param {Array} dates - Array of date objects to be filtered.
   * @returns {Array} Filtered array of date objects without weekends.
   */
  filterWeekends(dates) {
    const weekday = this.#dateFormat.day_short;
    return dates.filter((date) => {
      const dayName = weekday[new Date(date).getDay()];
      return !this.options.weekends.includes(dayName);
    });
  }

  /**
   * method to select a task row and task
   * @param { Object } task task to select
   */
  selectTask(task) {
    this.removeClassFromElements(".js-gantt-selected", "js-gantt-selected");
    this.removeClassFromElements(
      ".js-gantt-selected-task-bar",
      "js-gantt-selected-task-bar"
    );

    // Scroll horizontal scroll to the selected task bar
    this.scrollToTask(task.id);

    // Select the current task bar
    const currentTaskBar = this.element.querySelector(
      `[js-gantt-taskbar-id="${task.id}"]`
    );

    if (currentTaskBar) {
      currentTaskBar.classList.add("js-gantt-selected-task-bar");
    }

    // Select the task row
    const taskRows = this.element.querySelectorAll(
      `[js-gantt-task-id="${task.id}"]`
    );

    taskRows.forEach((item) => {
      item.classList.add("js-gantt-selected");
    });

    // Update selected task in options
    this.options.selectedRow = `${task.id}`;
    this.options.selectedTask = `${task.id}`;
  }

  /**
   * method to scroll to a perticular task.
   * @param {string | number} taskId
   */
  scrollToTask(taskId) {
    const horizontalScroll = this.element.querySelector(".js-gantt-hor-scroll");
    const taskBar = this.element.querySelector(
      `[js-gantt-taskbar-id="${taskId}"]`
    );

    if (taskBar && horizontalScroll) {
      const cellBefore = taskBar.offsetLeft - 80;
      horizontalScroll.scrollLeft = cellBefore < 0 ? 0 : cellBefore;
    }
  }

  /**
   * Helper method to remove a class from elements matching the selector
   * @param { string } selector - CSS selector to find elements
   * @param { string } className - Class name to remove
   */
  removeClassFromElements(selector, className) {
    const elements = this.element.querySelectorAll(selector);
    elements.forEach((element) => {
      element.classList.remove(className);
    });
  }

  /**
   * Determines whether an object has a property with the specified name.
   * Uses imported hasProperty utility
   * @param {Object} obj - The object to check.
   * @param {string} property - The property to check for.
   * @returns {boolean} - true if the property exists on the object, otherwise false.
   */
  hasProperty(obj, property) {
    return hasProperty(obj, property);
  }

  /**
   * @param {string} template - Name of template
   * @param {...any} params - Parameters to be passed to the template if it is a function
   * Method to get template values
   */
  callTemplate(template, ...params) {
    // Using imported isFunction utility
    if (isFunction(this.templates[template])) {
      return this.templates[template](...params);
    }

    return this.templates[template];
  }

  /**
   * Method to check if a task is not present in the searched data.
   * @param {string | number} taskId - The ID of the task to check.
   * @returns {boolean} - True if the task is not in the searched data, false otherwise.
   */
  isTaskNotInSearchedData(taskId) {
    return !!(this.#searchedData && !this.#searchedData.includes(taskId));
  }

  /**
   * Method to check if task is opened or collapsed.
   * Uses TaskManager for state management.
   * @param {number | string} id task id
   * @returns {boolean} True if task is expanded.
   */
  isTaskOpened(id) {
    // Sync with TaskManager
    if (this.#taskManager) {
      return this.#taskManager.isExpanded(id);
    }
    return this.options.openedTasks.includes(id);
  }

  /**
   * Method to add a task to the list of opened tasks (expand).
   * Uses TaskManager for state management.
   * @param {number | string} id task id
   */
  addTaskToOpenedList(id) {
    if (!this.options.openedTasks.includes(id)) {
      this.options.openedTasks.push(id);
    }
    // Sync with TaskManager
    if (this.#taskManager) {
      this.#taskManager.expand(id);
    }
  }

  /**
   * Method to remove a task from the list of opened tasks (collapse).
   * Uses TaskManager for state management.
   * @param {number | string} id task id
   */
  removeTaskFromOpenedList(id) {
    const openedTaskIndex = this.options.openedTasks.indexOf(id);
    if (openedTaskIndex > -1) {
      this.options.openedTasks.splice(openedTaskIndex, 1);
    }
    // Sync with TaskManager
    if (this.#taskManager) {
      this.#taskManager.collapse(id);
    }
  }

  /**
   * Toggle task expanded/collapsed state.
   * @param {number | string} id task id
   */
  toggleTask(id) {
    if (this.isTaskOpened(id)) {
      this.removeTaskFromOpenedList(id);
    } else {
      this.addTaskToOpenedList(id);
    }
    // Sync with TaskManager
    if (this.#taskManager) {
      this.#taskManager.toggle(id);
    }
  }

  /**
   * Safely queries an element with null checking
   * @private
   * @param {string} selector - CSS selector
   * @param {HTMLElement} [root=this.element] - Root element to search within
   * @returns {HTMLElement|null} The element or null if not found
   */
  safeQuery(selector, root = this.element) {
    try {
      if (!root || !selector) {
        return null;
      }
      return root.querySelector(selector);
    } catch (error) {
      console.warn(
        `[javascriptgantt] Failed to query selector "${selector}":`,
        error
      );
      return null;
    }
  }

  /**
   * Safely queries all elements with null checking
   * @private
   * @param {string} selector - CSS selector
   * @param {HTMLElement} [root=this.element] - Root element to search within
   * @returns {NodeList} The elements found (empty NodeList if not found)
   */
  safeQueryAll(selector, root = this.element) {
    try {
      if (!root || !selector) {
        return document.querySelectorAll(null); // Returns empty NodeList
      }
      return root.querySelectorAll(selector);
    } catch (error) {
      console.warn(
        `[javascriptgantt] Failed to query all elements "${selector}":`,
        error
      );
      return document.querySelectorAll(null); // Returns empty NodeList
    }
  }

  /**
   * Handles errors and dispatches error event
   * @private
   * @param {Error} error - The error object
   * @param {string} context - Where the error occurred
   * @returns {void}
   */
  handleError(error, context = "unknown") {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };

    console.error(`[javascriptgantt] Error in ${context}:`, error, errorInfo);

    this.dispatchEvent("onError", errorInfo);
  }

  /**
   * Measures execution time of a function
   * @private
   * @param {string} label - Label for this measurement
   * @param {Function} callback - Function to measure
   * @returns {*} Return value of callback
   */
  measurePerformance(label, callback) {
    const startTime = performance.now();

    try {
      const result = callback();
      const duration = performance.now() - startTime;

      if (duration > 100) {
        console.warn(
          `[javascriptgantt] Performance warning: "${label}" took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `[javascriptgantt] Error in "${label}" after ${duration.toFixed(2)}ms:`,
        error
      );
      this.handleError(error, label);
      throw error;
    }
  }

  /**
   * Checks browser compatibility and logs warnings
   * @private
   * @returns {Object} Compatibility info
   */
  checkBrowserCompatibility() {
    const compatibility = {
      supportsPrivateFields: true,
      supportsWeakMap: true,
      supportsObjectHasOwn: typeof Object.hasOwn === "function",
      supportsArrayIncludes: Array.prototype.includes !== undefined,
      warnings: [],
    };

    if (!compatibility.supportsObjectHasOwn) {
      compatibility.warnings.push(
        "[javascriptgantt] Object.hasOwn is not supported. Using fallback."
      );
    }

    if (!compatibility.supportsArrayIncludes) {
      compatibility.warnings.push(
        "[javascriptgantt] Array.includes is not supported. Some features may not work."
      );
    }

    compatibility.warnings.forEach((warning) => {
      console.warn(warning);
    });

    return compatibility;
  }


  /**
   * Destroys the Gantt instance and cleans up all resources
   * Call this when removing the Gantt chart from the DOM
   * @returns {void}
   * @example
   * gantt.destroy();
   */
  destroy() {
    try {
      // Clean up EventManager
      if (this.#eventManager) {
        this.#eventManager.removeAllListeners();
      }

      // Remove all event listeners by cloning elements
      if (this.element) {
        const allElements = this.element.querySelectorAll("*");
        allElements.forEach((el) => {
          const oldEl = el;
          const newEl = oldEl.cloneNode(true);
          if (oldEl.parentNode) {
            oldEl.parentNode.replaceChild(newEl, oldEl);
          }
        });
      }

      // Clear all debounce timers
      this.#debounceTimers.forEach((timer) => {
        clearTimeout(timer);
      });
      this.#debounceTimers.clear();

      // Clear search data
      this.#searchedData = undefined;

      // Clear DOM content
      if (this.element) {
        this.element.innerHTML = "";
      }

      // Clear data references
      if (this.options) {
        this.options.data = [];
        this.options.openedTasks = [];
        this.options.selectedRow = "";
        this.options.selectedTask = "";
      }
      if (this.originalData) {
        this.originalData = [];
      }

      // Clean up module managers
      this.#eventManager = null;
      this.#taskManager = null;
      this.#linkManager = null;
      this.#scaleManager = null;
      this.#i18nManager = null;

      // Null out key references
      this.element = null;
      this.options = null;
      this.originalData = null;
      this.templates = null;

      // Dispatch destroy event
      if (typeof window !== "undefined") {
        this.dispatchEvent("onDestroy", { timestamp: new Date() });
      }
    } catch (error) {
      console.error("[javascriptgantt] Error during destruction:", error);
    }
  }

  /**
   * Get event manager for external access
   * @returns {EventManager} Event manager instance
   */
  getEventManager() {
    return this.#eventManager;
  }

  /**
   * Get task manager for external access
   * @returns {TaskManager} Task manager instance
   */
  getTaskManager() {
    return this.#taskManager;
  }

  /**
   * Get link manager for external access
   * @returns {LinkManager} Link manager instance
   */
  getLinkManager() {
    return this.#linkManager;
  }

  /**
   * Get scale manager for external access
   * @returns {ScaleManager} Scale manager instance
   */
  getScaleManager() {
    return this.#scaleManager;
  }

  /**
   * Get i18n manager for external access
   * @returns {I18nManager} I18n manager instance
   */
  getI18nManager() {
    return this.#i18nManager;
  }

  // ============= Utility Methods (using imported utilities) =============

  // ============= TaskManager Convenience Methods =============

  /**
   * Get task by ID using TaskManager.
   * @param {string|number} taskId - Task ID.
   * @returns {Object|null} Task object or null.
   */
  getTaskById(taskId) {
    if (this.#taskManager) {
      return this.#taskManager.getTask(taskId);
    }
    return this.getTask(taskId);
  }

  /**
   * Get all tasks as a flat array using TaskManager.
   * @returns {Array} Array of all tasks.
   */
  getAllTasks() {
    if (this.#taskManager) {
      return this.#taskManager.flattenTasks();
    }
    const result = [];
    this.eachTask((task) => result.push(task));
    return result;
  }

  /**
   * Search tasks by text using TaskManager.
   * @param {string} query - Search query.
   * @param {string[]} fields - Fields to search (default: ['name', 'text']).
   * @returns {Array} Matching tasks.
   */
  searchTasks(query, fields = ["name", "text", "description"]) {
    if (this.#taskManager) {
      return this.#taskManager.search(query, fields);
    }
    const result = [];
    const lowerQuery = query.toLowerCase();
    this.eachTask((task) => {
      if (fields.some((f) => task[f]?.toLowerCase?.().includes(lowerQuery))) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Get tasks by date range using TaskManager.
   * @param {Date} startDate - Start date.
   * @param {Date} endDate - End date.
   * @returns {Array} Tasks in the date range.
   */
  getTasksByDateRange(startDate, endDate) {
    if (this.#taskManager) {
      return this.#taskManager.getTasksByDateRange(startDate, endDate);
    }
    const result = [];
    this.eachTask((task) => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date || task.start_date);
      if (taskStart <= endDate && taskEnd >= startDate) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Get child tasks of a parent using TaskManager.
   * @param {string|number} parentId - Parent task ID.
   * @returns {Array} Child tasks.
   */
  getChildTasks(parentId) {
    if (this.#taskManager) {
      return this.#taskManager.getChildren(parentId);
    }
    const parent = this.getTask(parentId);
    return parent?.children || [];
  }

  /**
   * Get parent task using TaskManager.
   * @param {string|number} taskId - Task ID.
   * @returns {Object|null} Parent task or null.
   */
  getParentTask(taskId) {
    if (this.#taskManager) {
      return this.#taskManager.getParent(taskId);
    }
    const task = this.getTask(taskId);
    return task?.parent ? this.getTask(task.parent) : null;
  }

  /**
   * Move task to new parent using TaskManager.
   * @param {string|number} taskId - Task to move.
   * @param {string|number|null} newParentId - New parent ID (null for root).
   * @returns {boolean} True if moved successfully.
   */
  moveTask(taskId, newParentId) {
    if (this.#taskManager) {
      const result = this.#taskManager.moveTask(taskId, newParentId);
      if (result) {
        this.render();
        this.dispatchEvent("onTaskMove", { taskId, newParentId });
      }
      return result;
    }
    return false;
  }

  /**
   * Sort tasks by property using TaskManager.
   * @param {string} property - Property to sort by.
   * @param {boolean} ascending - Sort direction (default: true).
   */
  sortTasks(property, ascending = true) {
    if (this.#taskManager) {
      this.#taskManager.sort(property, ascending);
      this.render();
      this.dispatchEvent("onTaskSort", { property, ascending });
    }
  }

  /**
   * Get task count using TaskManager.
   * @returns {number} Total number of tasks.
   */
  getTaskCount() {
    if (this.#taskManager) {
      return this.#taskManager.getTaskCount();
    }
    return this.getAllTasks().length;
  }

  /**
   * Calculate progress for a parent task based on children.
   * @param {string|number} taskId - Task ID.
   * @returns {number} Calculated progress percentage.
   */
  calculateTaskProgress(taskId) {
    if (this.#taskManager) {
      return this.#taskManager.calculateProgress(taskId);
    }
    const task = this.getTask(taskId);
    if (!task?.children?.length) return task?.progress || 0;
    const total = task.children.reduce((sum, c) => sum + (c.progress || 0), 0);
    return Math.round(total / task.children.length);
  }

  // ============= I18nManager Convenience Methods =============

  /**
   * Set the locale for date formatting and labels.
   * Uses I18nManager for locale management.
   * @param {string} locale - Locale code (e.g., 'en', 'es', 'fr', 'de', 'zh')
   */
  setLocale(locale) {
    if (this.#i18nManager) {
      this.#i18nManager.setLocale(locale);
      // Update date format from I18nManager
      const translation = this.#i18nManager.getTranslation();
      if (translation) {
        this.#dateFormat = {
          ...this.#dateFormat,
          month_full: translation.month_full || this.#dateFormat.month_full,
          month_short: translation.month_short || this.#dateFormat.month_short,
          day_full: translation.day_full || this.#dateFormat.day_full,
          day_short: translation.day_short || this.#dateFormat.day_short,
        };
      }
      this.render(); // Re-render with new locale
    }
  }

  /**
   * Get a translated label using I18nManager.
   * @param {string} key - Translation key (e.g., 'labels.save', 'buttons.cancel').
   * @param {Object} params - Interpolation parameters.
   * @returns {string} Translated string.
   */
  translate(key, params = {}) {
    if (this.#i18nManager) {
      return this.#i18nManager.t(key, params);
    }
    return key;
  }

  /**
   * Get current locale.
   * @returns {string} Current locale code.
   */
  getLocale() {
    if (this.#i18nManager) {
      return this.#i18nManager.currentLocale;
    }
    return this.options.localLang || "en";
  }

  /**
   * Add a custom locale.
   * @param {string} locale - Locale code.
   * @param {Object} translations - Translation object.
   */
  addLocale(locale, translations) {
    if (this.#i18nManager) {
      this.#i18nManager.addLocale(locale, translations);
    }
  }

  /**
   * Get available locales.
   * @returns {string[]} Array of available locale codes.
   */
  getAvailableLocales() {
    if (this.#i18nManager) {
      return this.#i18nManager.getAvailableLocales();
    }
    return Object.keys(this.options.i18n || {});
  }

  // ============= ScaleManager Convenience Methods =============

  /**
   * Get scale configuration for a zoom level.
   * @param {string} zoomLevel - Zoom level (hour, day, week, month, quarter, year).
   * @returns {Object} Scale configuration.
   */
  getScaleConfig(zoomLevel) {
    if (this.#scaleManager) {
      return this.#scaleManager.getScaleConfig(zoomLevel);
    }
    return null;
  }

  /**
   * Check if a date is today using ScaleManager.
   * @param {Date} date - Date to check.
   * @returns {boolean} True if date is today.
   */
  isToday(date) {
    if (this.#scaleManager) {
      return this.#scaleManager.isToday(date);
    }
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is a weekend using ScaleManager.
   * @param {Date} date - Date to check.
   * @param {number[]} weekends - Weekend day numbers (default: [0, 6]).
   * @returns {boolean} True if date is a weekend.
   */
  isWeekendDate(date, weekends = [0, 6]) {
    if (this.#scaleManager) {
      return this.#scaleManager.isWeekend(date, weekends);
    }
    return weekends.includes(new Date(date).getDay());
  }

  // ============= EventManager Convenience Methods =============

  /**
   * Register a one-time event listener using EventManager.
   * @param {string} eventName - Event name.
   * @param {Function} callback - Callback function.
   */
  once(eventName, callback) {
    if (this.#eventManager) {
      this.#eventManager.once(eventName, callback);
    }
  }

  /**
   * Remove an event listener using EventManager.
   * @param {string} eventName - Event name.
   * @param {Function} callback - Callback function.
   */
  off(eventName, callback) {
    if (this.#eventManager) {
      this.#eventManager.off(eventName, callback);
    }
  }

  /**
   * Check if an event has listeners.
   * @param {string} eventName - Event name.
   * @returns {boolean} True if event has listeners.
   */
  hasEventListeners(eventName) {
    if (this.#eventManager) {
      return this.#eventManager.hasListeners(eventName);
    }
    return false;
  }

  /**
   * Create a debounced function using EventManager.
   * @param {Function} handler - Handler function.
   * @param {number} delay - Debounce delay in ms.
   * @returns {Function} Debounced function.
   */
  createDebounce(handler, delay = 100) {
    if (this.#eventManager) {
      return this.#eventManager.debounce(handler, delay);
    }
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(...args), delay);
    };
  }

  /**
   * Create a throttled function using EventManager.
   * @param {Function} handler - Handler function.
   * @param {number} limit - Throttle limit in ms.
   * @returns {Function} Throttled function.
   */
  createThrottle(handler, limit = 100) {
    if (this.#eventManager) {
      return this.#eventManager.throttle(handler, limit);
    }
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        handler(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // ============= Legacy Utility Methods =============


  /**
   * Clone data deeply using imported deepClone utility
   * @param {any} data - Data to clone
   * @returns {any} Cloned data
   */
  cloneData(data) {
    return deepClone(data);
  }

  /**
   * Find a task in data by property using imported findBy
   * @param {string} prop - Property name
   * @param {any} value - Value to match
   * @returns {Object|null} Found task or null
   */
  findTaskBy(prop, value) {
    return findBy(this.options.data || [], prop, value);
  }

  /**
   * Group tasks by a property using imported groupBy
   * @param {string} prop - Property to group by
   * @returns {Object} Grouped tasks
   */
  groupTasksBy(prop) {
    return groupBy(this.options.data || [], prop);
  }

  /**
   * Sort tasks by a property using imported sortBy
   * @param {string} prop - Property to sort by
   * @param {boolean} ascending - Sort direction
   * @returns {Array} Sorted tasks
   */
  sortTasksBy(prop, ascending = true) {
    return sortBy(this.options.data || [], prop, ascending);
  }

  /**
   * Calculate days between two dates using imported daysBetween
   * @param {Date|string} date1 - First date
   * @param {Date|string} date2 - Second date
   * @returns {number} Number of days
   */
  getDaysBetween(date1, date2) {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return daysBetween(d1, d2);
  }

  /**
   * Add days to a date using imported addDays
   * @param {Date|string} date - Start date
   * @param {number} days - Days to add
   * @returns {Date} New date
   */
  addDaysToDate(date, days) {
    const d = date instanceof Date ? date : new Date(date);
    return addDays(d, days);
  }

  /**
   * Check if a date is a weekend using imported isWeekend
   * @param {Date|string} date - Date to check
   * @returns {boolean} True if weekend
   */
  isDateWeekend(date) {
    const d = date instanceof Date ? date : new Date(date);
    return isWeekend(d, this.options.weekends || [0, 6]);
  }

  // ============= DOM Utility Methods (using imported domUtils) =============

  /**
   * Create an element using imported createElement utility
   * @param {string} tag - HTML tag name
   * @param {Object} options - Element options {id, classes, text, html, styles, attributes}
   * @returns {HTMLElement} Created element
   */
  createEl(tag, options = {}) {
    return createElement(tag, options);
  }

  /**
   * Safe query selector using imported querySelector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} root - Root element (defaults to this.element)
   * @returns {HTMLElement|null} Found element or null
   */
  query(selector, root = this.element) {
    return querySelector(selector, root || document);
  }

  /**
   * Safe query all selector using imported querySelectorAll
   * @param {string} selector - CSS selector
   * @param {HTMLElement} root - Root element (defaults to this.element)
   * @returns {NodeList} Found elements
   */
  queryAll(selector, root = this.element) {
    return querySelectorAll(selector, root || document);
  }

  /**
   * Add class to element using imported addClass
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to add
   */
  addClassToEl(element, className) {
    addClass(element, className);
  }

  /**
   * Remove class from element using imported removeClass
   * @param {HTMLElement} element - Target element
   * @param {string} className - Class name to remove
   */
  removeClassFromEl(element, className) {
    removeClass(element, className);
  }

  /**
   * Check if element has class using imported hasClass
   * @param {HTMLElement} element - Element to check
   * @param {string} className - Class name
   * @returns {boolean} True if has class
   */
  elHasClass(element, className) {
    return hasClass(element, className);
  }

  /**
   * Set styles on element using imported setStyles
   * @param {HTMLElement} element - Target element
   * @param {Object} styles - Styles object
   */
  setElStyles(element, styles) {
    setStyles(element, styles);
  }

  /**
   * Get element position using imported getElementPosition
   * @param {HTMLElement} element - Target element
   * @returns {Object} Position {top, left, width, height, right, bottom}
   */
  getElPosition(element) {
    return getElementPosition(element);
  }
}

// ES6 exports
export { javascriptgantt };
export default javascriptgantt;

// Also expose to window for backward compatibility
if (typeof window !== "undefined") {
  window.javascriptgantt = javascriptgantt;
}

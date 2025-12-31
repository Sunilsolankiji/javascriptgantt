/**
 * I18nManager Module
 * Handles internationalization and localization
 */

class I18nManager {
  constructor(options = {}) {
    this.currentLocale = options.locale || "en";
    this.fallbackLocale = options.fallbackLocale || "en";
    this.translations = new Map();

    // Initialize default locales
    this.initDefaultLocales();

    // Add custom translations
    if (options.i18n) {
      Object.entries(options.i18n).forEach(([locale, translations]) => {
        this.addLocale(locale, translations);
      });
    }
  }

  /**
   * Initialize default locale translations
   */
  initDefaultLocales() {
    // English
    this.addLocale("en", {
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
      labels: {
        new_task: "New Task",
        delete_task: "Delete Task",
        save: "Save",
        cancel: "Cancel",
        description: "Description",
        progress: "Progress",
        start_date: "Start Date",
        end_date: "End Date",
        duration: "Duration",
        name: "Name",
        resource: "Resource",
        link_add: "Add Link",
        link_delete: "Delete Link",
        confirm_delete: "Are you sure you want to delete this task?",
        loading: "Loading...",
        no_data: "No data to display",
        today: "Today",
        week: "Week",
        month: "Month",
        quarter: "Quarter",
        year: "Year",
        day: "Day",
        hour: "Hour",
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        add: "Add",
        edit: "Edit",
        close: "Close",
      },
      messages: {
        task_deleted: "Task deleted successfully",
        task_added: "Task added successfully",
        task_updated: "Task updated successfully",
        error: "An error occurred",
      },
    });

    // Spanish
    this.addLocale("es", {
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
      labels: {
        new_task: "Nueva Tarea",
        delete_task: "Eliminar Tarea",
        save: "Guardar",
        cancel: "Cancelar",
        description: "Descripción",
        progress: "Progreso",
        start_date: "Fecha de Inicio",
        end_date: "Fecha de Fin",
        duration: "Duración",
        name: "Nombre",
        resource: "Recurso",
        today: "Hoy",
      },
      buttons: {
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        add: "Añadir",
        edit: "Editar",
        close: "Cerrar",
      },
    });

    // French
    this.addLocale("fr", {
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
        "Jun",
        "Jul",
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
      labels: {
        new_task: "Nouvelle Tâche",
        delete_task: "Supprimer la Tâche",
        save: "Sauvegarder",
        cancel: "Annuler",
        description: "Description",
        progress: "Progression",
        start_date: "Date de Début",
        end_date: "Date de Fin",
        duration: "Durée",
        name: "Nom",
        today: "Aujourd'hui",
      },
      buttons: {
        save: "Sauvegarder",
        cancel: "Annuler",
        delete: "Supprimer",
        add: "Ajouter",
        edit: "Modifier",
        close: "Fermer",
      },
    });

    // German
    this.addLocale("de", {
      month_full: [
        "Januar",
        "Februar",
        "März",
        "April",
        "Mai",
        "Juni",
        "Juli",
        "August",
        "September",
        "Oktober",
        "November",
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
      labels: {
        new_task: "Neue Aufgabe",
        delete_task: "Aufgabe löschen",
        save: "Speichern",
        cancel: "Abbrechen",
        description: "Beschreibung",
        progress: "Fortschritt",
        start_date: "Startdatum",
        end_date: "Enddatum",
        duration: "Dauer",
        name: "Name",
        today: "Heute",
      },
      buttons: {
        save: "Speichern",
        cancel: "Abbrechen",
        delete: "Löschen",
        add: "Hinzufügen",
        edit: "Bearbeiten",
        close: "Schließen",
      },
    });

    // Chinese (Simplified)
    this.addLocale("zh", {
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
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ],
      day_short: ["日", "一", "二", "三", "四", "五", "六"],
      labels: {
        new_task: "新任务",
        delete_task: "删除任务",
        save: "保存",
        cancel: "取消",
        description: "描述",
        progress: "进度",
        start_date: "开始日期",
        end_date: "结束日期",
        duration: "持续时间",
        name: "名称",
        today: "今天",
      },
      buttons: {
        save: "保存",
        cancel: "取消",
        delete: "删除",
        add: "添加",
        edit: "编辑",
        close: "关闭",
      },
    });
  }

  /**
   * Add or update a locale
   * @param {string} locale - Locale code
   * @param {Object} translations - Translation object
   */
  addLocale(locale, translations) {
    const existing = this.translations.get(locale) || {};
    this.translations.set(locale, this.deepMerge(existing, translations));
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Set current locale
   * @param {string} locale - Locale code
   */
  setLocale(locale) {
    if (!this.translations.has(locale)) {
      console.warn(
        `Locale "${locale}" not found, using fallback "${this.fallbackLocale}"`
      );
    }
    this.currentLocale = locale;
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Get available locales
   * @returns {string[]} Available locale codes
   */
  getAvailableLocales() {
    return Array.from(this.translations.keys());
  }

  /**
   * Translate a key
   * @param {string} key - Translation key (e.g., 'labels.save')
   * @param {Object} params - Interpolation parameters
   * @returns {string} Translated string
   */
  t(key, params = {}) {
    let translation = this.getNestedValue(
      this.translations.get(this.currentLocale),
      key
    );

    // Fallback to default locale
    if (!translation) {
      translation = this.getNestedValue(
        this.translations.get(this.fallbackLocale),
        key
      );
    }

    // Return key if translation not found
    if (!translation) {
      console.warn(`Translation not found: ${key}`);
      return key;
    }

    // Interpolate parameters
    if (typeof translation === "string" && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(
          new RegExp(`{${paramKey}}`, "g"),
          value
        );
      });
    }

    return translation;
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {any} Value or undefined
   */
  getNestedValue(obj, path) {
    if (!obj) {
      return undefined;
    }
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Get month names
   * @param {boolean} short - Use short names
   * @returns {string[]} Month names
   */
  getMonthNames(short = false) {
    const translations =
      this.translations.get(this.currentLocale) ||
      this.translations.get(this.fallbackLocale);
    return short ? translations.month_short : translations.month_full;
  }

  /**
   * Get day names
   * @param {boolean} short - Use short names
   * @returns {string[]} Day names
   */
  getDayNames(short = false) {
    const translations =
      this.translations.get(this.currentLocale) ||
      this.translations.get(this.fallbackLocale);
    return short ? translations.day_short : translations.day_full;
  }

  /**
   * Format date with locale
   * @param {Date} date - Date to format
   * @param {string} format - Format string
   * @returns {string} Formatted date
   */
  formatDate(date, format = "YYYY-MM-DD") {
    const monthNames = this.getMonthNames();
    const monthShort = this.getMonthNames(true);
    const dayNames = this.getDayNames();
    const dayShort = this.getDayNames(true);

    return format
      .replace("YYYY", date.getFullYear())
      .replace("YY", String(date.getFullYear()).slice(-2))
      .replace("MMMM", monthNames[date.getMonth()])
      .replace("MMM", monthShort[date.getMonth()])
      .replace("MM", String(date.getMonth() + 1).padStart(2, "0"))
      .replace("M", date.getMonth() + 1)
      .replace("DD", String(date.getDate()).padStart(2, "0"))
      .replace("D", date.getDate())
      .replace("dddd", dayNames[date.getDay()])
      .replace("ddd", dayShort[date.getDay()]);
  }

  /**
   * Get translations for current locale
   * @returns {Object} Translations object
   */
  getTranslations() {
    return (
      this.translations.get(this.currentLocale) ||
      this.translations.get(this.fallbackLocale)
    );
  }
}

export { I18nManager };

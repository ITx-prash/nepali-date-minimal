import GLib from "gi://GLib";
import GObject from "gi://GObject";
import St from "gi://St";
import Clutter from "gi://Clutter";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { calendarData } from "./calendar-data.js";

const MONTH_NAMES = [
  "Baisakh", "Jestha", "Ashar", "Shrawan", "Bhadra", "Ashoj",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

// Days between two AD dates, timezone-safe (compares UTC midnights)
const adDayNumber = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);

function toBikramSambat(y, m, d) {
  let remaining =
    adDayNumber(y, m, d) -
    adDayNumber(calendarData.anchor.ad.y, calendarData.anchor.ad.m, calendarData.anchor.ad.d);
  if (remaining < 0) return null;

  let bsYear = calendarData.firstYear;
  while (bsYear <= calendarData.lastYear) {
    const row = calendarData.monthsByYear[bsYear];
    let month = 0;
    while (month < 12 && remaining >= row[month]) {
      remaining -= row[month];
      month++;
    }
    if (month < 12) return { year: bsYear, month: month + 1, day: remaining + 1 };
    bsYear++;
  }
  return null;
}

export default class NepaliDateMinimal extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._settingsHandlers = [
      this._settings.connect("changed::show-suffix", () => this._updateLabel()),
      this._settings.connect("changed::font-size", () => this._applyFontSize()),
      // Rebuild indicator when panel box position changes
      this._settings.connect("changed::position", () => this._buildIndicator()),
    ];

    this._buildIndicator();

    // Update periodically so the date rolls over at midnight
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      60,
      () => {
        this._updateLabel();
        return GLib.SOURCE_CONTINUE;
      },
    );
  }

  disable() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }

    if (this._settings) {
      for (const handler of this._settingsHandlers ?? []) {
        this._settings.disconnect(handler);
      }
      this._settingsHandlers = null;
      this._settings = null;
    }

    this._label?.destroy();
    this._indicator?.destroy();
    this._indicator = null;
    this._label = null;
  }

  _buildIndicator() {
    this._indicator?.destroy();

    this._label = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      text: "",
    });

    this._indicator = new NepaliDateButton(this._label, this.uuid);
    Main.panel.addToStatusArea(this.uuid, this._indicator, undefined, this._settings.get_string("position"));

    this._updateLabel();
    this._applyFontSize();
  }

  _updateLabel() {
    const now = new Date();
    const bs = toBikramSambat(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const suffix = this._settings?.get_boolean("show-suffix") ? " B.S." : "";
    this._label?.set_text(
      bs ? `${MONTH_NAMES[bs.month - 1]} ${bs.day}, ${bs.year}${suffix}` : "...",
    );
  }

  _applyFontSize() {
    const size = this._settings?.get_int("font-size") ?? 0;
    if (this._label) {
      this._label.style = size > 0 ? `font-size: ${size}px;` : "";
    }
  }
}

const NepaliDateButton = GObject.registerClass(
  class NepaliDateButton extends PanelMenu.Button {
    constructor(label, role) {
      // Pass true for dontCreateMenu since this is a plain status display button
      super(0.0, role, true);
      this.reactive = false;
      this.can_focus = false;
      this.add_child(label);
    }
  },
);

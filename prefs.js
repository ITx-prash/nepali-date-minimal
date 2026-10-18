import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class NepaliDateMinimalPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({
      title: "Display",
      description: "How the Bikram Sambat date appears in the top panel.",
    });

    const suffixRow = new Adw.SwitchRow({
      title: "Show B.S. suffix",
      subtitle: 'Render the date as "Kartik 2, 2083 B.S."',
    });
    settings.bind("show-suffix", suffixRow, "active", 0);

    const positionRow = new Adw.ComboRow({
      title: "Position",
      subtitle: "Where the date sits in the panel",
      model: new Gtk.StringList({ strings: ["Left box", "Center box"] }),
    });
    const POSITION_VALUES = ["left", "center"];
    positionRow.selected = POSITION_VALUES.indexOf(settings.get_string("position"));
    positionRow.connect("notify::selected", () => {
      const value = POSITION_VALUES[positionRow.selected];
      if (value) settings.set_string("position", value);
    });
    const positionHandler = settings.connect("changed::position", () => {
      const index = POSITION_VALUES.indexOf(settings.get_string("position"));
      if (index >= 0 && index !== positionRow.selected) positionRow.selected = index;
    });

    const sizeAdjustment = new Gtk.Adjustment({
      lower: 0, upper: 32, step_increment: 1, page_increment: 2,
      value: settings.get_int("font-size"),
    });
    const fontSizeRow = new Adw.SpinRow({
      title: "Font size (px)",
      subtitle: "0 follows the panel theme, useful with fractional scaling",
      adjustment: sizeAdjustment,
    });
    const sizeHandler = settings.connect("changed::font-size", () => {
      const value = settings.get_int("font-size");
      if (value !== fontSizeRow.value) fontSizeRow.value = value;
    });
    fontSizeRow.connect("notify::value", () => {
      if (fontSizeRow.value !== settings.get_int("font-size")) settings.set_int("font-size", fontSizeRow.value);
    });

    window.connect("close-request", () => {
      settings.disconnect(positionHandler);
      settings.disconnect(sizeHandler);
      return false;
    });

    group.add(suffixRow);
    group.add(positionRow);
    group.add(fontSizeRow);
    page.add(group);
    window.add(page);
  }
}

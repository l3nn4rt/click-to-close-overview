/* prefs.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const GSCHEMA = 'org.gnome.shell.extensions.click-to-close-overview';

function init() { }

function buildPrefsWidget() {
	let gschema = Gio.SettingsSchemaSource.new_from_directory(
		Me.dir.get_child('schemas').get_path(),
		Gio.SettingsSchemaSource.get_default(),
		false
	);

	this.settings = new Gio.Settings({
		settings_schema: gschema.lookup(GSCHEMA, true)
	});

	let prefsWidget = new Gtk.Grid({
		margin: 24,
		column_spacing: 12,
		row_spacing: 12,
		visible: true
	});

	let toggleLabel = new Gtk.Label({
		label: 'Show animation when closing the applications page:',
		halign: Gtk.Align.START,
		hexpand: true,
		visible: true
	});
	prefsWidget.attach(toggleLabel, 0, 0, 1, 1);

	let toggle = new Gtk.Switch({
		active: this.settings.get_boolean('animate-app-display'),
		halign: Gtk.Align.END,
		visible: true
	});
	prefsWidget.attach(toggle, 1, 0, 1, 1);

	this.settings.bind(
		'animate-app-display',
		toggle,
		'active',
		Gio.SettingsBindFlags.DEFAULT
	);

	return prefsWidget;
}

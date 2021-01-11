/* extension.js
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

const IconGrid = imports.ui.iconGrid;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const GSCHEMA = 'org.gnome.shell.extensions.click-to-close-overview';

class ClickToCloseOverview {
	constructor() {
		let gschema = Gio.SettingsSchemaSource.new_from_directory(
			Me.dir.get_child('schemas').get_path(),
			Gio.SettingsSchemaSource.get_default(),
			false
		);

		this.settings = new Gio.Settings({
			settings_schema: gschema.lookup(GSCHEMA, true)
		});
	}

	enable() {
		this._handlers = [];
		this._swiping = false;

		const wsDisplay = Main.overview.viewSelector._workspacesDisplay;
		const wsCallback = wsDisplay._clickAction.connect('clicked', action => {
				let event = Clutter.get_current_event();
				let index = wsDisplay._getMonitorIndexForEvent(event);
				if ((action.get_button() == 1 || action.get_button() == 0) &&
						!wsDisplay._workspacesViews[index].getActiveWorkspace().isEmpty())
						Main.overview.hide();
		});
		this._handlers.push([wsDisplay._clickAction, wsCallback]);


		this._oldAppsPageReactivity = Main.overview.viewSelector._appsPage.reactive;
		Main.overview.viewSelector._appsPage.reactive = true;

		this._appsPageClickAction = new Clutter.ClickAction();
		this._appsPageClickAction.connect('clicked', action => {
			if ((action.get_button() == 1 || action.get_button() == 0) &&
				!this._swiping) {
				if (this.settings.get_boolean('animate-app-display'))
					Main.overview.viewSelector.appDisplay.animate(
						IconGrid.AnimationDirection.OUT, () => {
							Main.overview.viewSelector._appsPage.hide();
							Main.overview.toggle();
					});
				else
					Main.overview.toggle();
			}
		});
		Main.overview.viewSelector._appsPage.add_action(this._appsPageClickAction);

		const tracker = Main.overview.viewSelector.appDisplay._swipeTracker;
		this._handlers.push([
			tracker,
			tracker.connect('begin', () => {
				this._swiping = true;
			})
		]);
		this._handlers.push([
			tracker,
			tracker.connect('end', () => {
				Mainloop.timeout_add(0, () => this._swiping = false);
			})
		]);
	}

	disable() {
		Main.overview.viewSelector._appsPage.reactive = this._oldAppsPageReactivity;
		this._oldAppsPageReactivity = null;

		this._handlers.forEach(([obj, callback]) => obj.disconnect(callback));
		this._handlers = null;

		Main.overview.viewSelector._appsPage.remove_action(this._appsPageClickAction);
	}
}

function init() {
	return new ClickToCloseOverview();
}

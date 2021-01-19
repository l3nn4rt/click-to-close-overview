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

		this.closeAppsPage = () => {
			Main.overview.viewSelector._appsPage.hide();
			Main.overview.toggle();
			this._appsPageClosing = false;
		};
	}

	enable() {
		/* connections to undo when disabling go here */
		this._connections = [];
		/* true when the user is scrolling apps grid */
		this._appsPageSwiping = false;
		/* true when closing the apps page for a click */
		this._appsPageClosing = false;


		/* connect to existing click action in workspaces page */
		const wsDisplay = Main.overview.viewSelector._workspacesDisplay;
		const wsCallback = wsDisplay._clickAction.connect('clicked', action => {
			let event = Clutter.get_current_event();
			let index = wsDisplay._getMonitorIndexForEvent(event);
			if ((action.get_button() == 1 || action.get_button() == 0) &&
			    !wsDisplay._workspacesViews[index].getActiveWorkspace().isEmpty())
				Main.overview.hide();
		});
		this._connections.push([wsDisplay._clickAction, wsCallback]);


		/* make the apps page susceptible to clicks */
		this._oldAppsPageReactivity = Main.overview.viewSelector._appsPage.reactive;
		Main.overview.viewSelector._appsPage.reactive = true;

		/* create new click action for the apps page */
		this._appsPageClickAction = new Clutter.ClickAction();
		const appCallback = this._appsPageClickAction.connect('clicked', action => {
			/* ignore non-primary clicks */
			if (action.get_button() !== 1 && action.get_button() !== 0)
				return;

			/* don't close while animating, unless fast-app-close enabled */
			if (Main.overview.viewSelector.appDisplay._grid._clonesAnimating.length &&
			    !this.settings.get_boolean('fast-app-close'))
			    return;

			/* don't close while scrolling */
			if (this._appsPageSwiping)
				return;

			/* prevent multiple animations when fast-app-close enabled */
			if (this._appsPageClosing)
				return;
			this._appsPageClosing = true;

			/* close, and animate if animate-app-display enabled */
			if (this.settings.get_boolean('animate-app-display'))
				Main.overview.viewSelector.appDisplay.animate(
					IconGrid.AnimationDirection.OUT, this.closeAppsPage);
			else
				this.closeAppsPage();
		});
		/* connect click action to the apps page */
		Main.overview.viewSelector._appsPage.add_action(this._appsPageClickAction);
		this._connections.push([this._appsPageClickAction, appCallback]);

		/* keep track of scrolls in the apps page */
		const tracker = Main.overview.viewSelector.appDisplay._swipeTracker;
		this._connections.push([
			tracker,
			tracker.connect('begin', () => {
				this._appsPageSwiping = true;
			})
		]);
		this._connections.push([
			tracker,
			tracker.connect('end', () => {
				Mainloop.timeout_add(0, () => this._appsPageSwiping = false);
			})
		]);
	}

	disable() {
		/* restore apps page reactivity */
		Main.overview.viewSelector._appsPage.reactive = this._oldAppsPageReactivity;
		this._oldAppsPageReactivity = null;

		/* disconnect callbacks */
		this._connections.forEach(([obj, callback]) => obj.disconnect(callback));
		this._connections = null;

		/* disconnect click action from the apps page */
		Main.overview.viewSelector._appsPage.remove_action(this._appsPageClickAction);
		this._appsPageClickAction = null;
	}
}

function init() {
	return new ClickToCloseOverview();
}

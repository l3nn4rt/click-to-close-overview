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

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

class ClickToCloseOverview {
	enable() {
		this._handlers = [];
		this._swiping = false;

		this._oldReactivity = Main.overview.viewSelector.reactive;
		Main.overview.viewSelector.reactive = true;

		this._handlers.push([
			Main.overview.viewSelector,
			Main.overview.viewSelector.connect('button-release-event', () => {
				if (!this._swiping)
					Main.overview.toggle();
			})
		]);

		[
			Main.overview.viewSelector._workspacesDisplay,
			Main.overview.viewSelector.appDisplay
		].map(display => display._swipeTracker).forEach(tracker => {
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
		});

	}

	disable() {
		Main.overview.viewSelector.reactive = this._oldReactivity;
		this._oldReactivity = null;

		this._handlers.forEach(([obj, callback]) => obj.disconnect(callback));
		this._handlers = null;
	}
}

function init() {
	return new ClickToCloseOverview();
}

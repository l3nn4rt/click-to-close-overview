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

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

class ClickToCloseOverview {
	enable() {
		this.handlers = [];
		this.swiping = false;

		this.oldReactivity = Main.overview.viewSelector.reactive;
		Main.overview.viewSelector.reactive = true;

		this.handlers.push([
			Main.overview.viewSelector,
			Main.overview.viewSelector.connect('button-release-event', () => {
				if (!this.swiping)
					Main.overview.toggle();
			})
		]);

		[
			Main.overview.viewSelector._workspacesDisplay,
			Main.overview.viewSelector.appDisplay
		].map(display => display._swipeTracker).forEach(tracker => {
			this.handlers.push([
				tracker,
				tracker.connect('begin', () => {
					this.swiping = true;
				})
			]);
			this.handlers.push([
				tracker,
				tracker.connect('end', () => {
					Mainloop.timeout_add(0, () => this.swiping = false);
				})
			]);
		});

	}

	disable() {
		Main.overview.viewSelector.reactive = this.oldReactivity;
		delete this.oldReactivity;

		this.handlers.forEach(([obj, callback]) => obj.disconnect(callback));
		delete this.handlers;
	}
}

function init() {
	return new ClickToCloseOverview();
}

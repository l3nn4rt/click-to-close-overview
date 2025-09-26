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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Clutter from 'gi://Clutter';

export default class ClickToCloseOverview {
	enable() {
		/* create new click action */
		this._gesture = new Clutter.ClickGesture();
		this._gesture.connect('recognize', action => {
			/* ignore non-primary clicks */
			if (action.get_button() !== 1 && action.get_button() !== 0)
				return;

			/* clicked actor */
			const [x, y] = global.get_pointer();
			const actor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);

			/* ignore clicks inside search box */
			const searchBox = Main.overview._overview._controls._searchEntry;
			if (actor === searchBox || actor.get_parent() === searchBox
					|| actor.get_parent().get_parent() === searchBox)
				return;

			Main.overview.toggle();
		});
		/* connect click action to the overview */
		Main.layoutManager.overviewGroup.add_action(this._gesture);
	}

	disable() {
		/* disconnect click action from the overview */
		Main.layoutManager.overviewGroup.remove_action(this._gesture);
		delete this._gesture;
	}
}

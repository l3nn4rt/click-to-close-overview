NAME = click-to-close-overview@l3nn4rt.github.io
SOURCE = ./src
ZIP = $(NAME).shell-extension.zip

.PHONY: _default pack install enable clean uninstall purge

_default: enable clean

pack:
	gnome-extensions pack -f $(SOURCE)

install: pack
	gnome-extensions install -f $(ZIP)

enable: install
	gnome-extensions enable -q $(NAME)

clean:
	rm -f $(ZIP)

uninstall:
	gnome-extensions uninstall $(NAME)

purge: clean uninstall

# node GK6X

This adds support for GK6X keyboards in nodejs.

--- 

This will allow you program a ton of custom configs, in Mac, Windows, and Linux.

## supported devices

On linux, you can see if your keyboard is supported by typing this:

```sh
lsusb
```

you should see a line that looks like this:

```
Bus 001 Device 016: ID 1ea7:0907 SHARKOON Technologies GmbH Keyboard
```

I'm not quite sure how to do this on other OS's (someone that uses them should let me know!) Basically a ton of programmable keyboards by epomaker (and clones) should work.

## usage

### permissions

On Linux, you will need to run with `sudo` or [add udev rules](https://github.com/node-hid/node-hid#udev-device-permissions) to give you access to raw HID devices.

I made one that looks like this, in /etc/udev/rules.d/gk6x.rules:

```
SUBSYSTEM=="input", GROUP="input", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="1ea7", ATTRS{idProduct}=="0907", MODE:="666", GROUP="plugdev"
KERNEL=="hidraw*", ATTRS{idVendor}=="1ea7", ATTRS{idProduct}=="0907", MODE="0666", GROUP="plugdev"
```

I added myself to `plugdev` (then rebooted):

```sh
sudo adduser $(whoami) plugdev
```

### CLI

You can install it globally with `npm i -g @gk6x/cli`, and it will install `gk6x` in your path. You can also use it without installing `npx @gk6x/cli`.

### library

You can also use this as a library in your own node-based project like this:

```sh
npm i @gk6x/core
```

It's probably only useful for people who want to write their own GUI or CLI utility.


## todo

- test on different OS's ([keyboard HID is known to be weird on mac/win](https://github.com/node-hid/node-hid#devices-node-hid-cannot-read))
- make cli app for getting/setting params from official files
- make TUI for setting up keyboard in terminal
- support for updating firmware (this seems to be missing form official software, too)
- make builds of cli (via pkg) and gui (via [neutralino](https://neutralino.js.org/) or electron)

## thanks

This is all due to [the awesome work of @pixeltris](https://github.com/pixeltris/GK6X) in C#. They, in-turn, used [@wgwoods work in python](https://github.com/wgwoods/gk64-python).
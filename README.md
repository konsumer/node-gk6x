# node GK6X

This adds support for GK6X keyboards in nodejs.

--- 

# WIP

This is a work in progress. It's not ready for use.

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

I'm not quite sure how to do this on other OS's (someone that uses them should let me know!)

## usage

### permissions

On Linux, you will need to run with `sudo` or [add udev rules](https://github.com/node-hid/node-hid#udev-device-permissions) to give you access to raw HID devices.


### CLI

> explanation goes here

### library

You can also use this as a library in your own node-based project like this:

```sh
npm i gk6x
```

> explanation goes here

## thanks

This is all due to [the awesome work of @pixeltris](https://github.com/pixeltris/GK6X) in C#. They, in-turn, used [@wgwoods work in python](https://github.com/wgwoods/gk64-python).
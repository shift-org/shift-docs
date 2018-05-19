# shiftcal

# This is the source code for the Shift/Pedalpalooza Calendar.

The purpose of the Shift/Pedalpalooza Calendar is to empower citizens to create and view bike events and to spread bike fun.

This repository has been sanitized of passwords from the copy running at http://shift2bikes.org/betacal , but if you'd like to see it in action that's where to check it out.

## Basic Architecture

The front-end uses jQuery, Mustache templates, and Bootstrap.

The back-end uses Flourish php and MySQL.

## License

This repository is under MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## How to setup & run locally

1. First install docker (only tested on linux and mac)
2. `cd` to the shiftcal directory
3. Run `./nift up`
4. Get a mysql dump from One
5. Temporarily move the dump into the shiftcal directory
6. Run `cat dump.sql | ./nift mysql-pipe`
7. Make a copy of `config.php.example` and rename it `config.php`
8. Access https://localhost:4443 and ignore the certificate warning

The event images are not included; the site will work without them. If you want to see the existing event images locally, get a backup of the images from One. Place the event images in `www/calendarimages`.

## To do list

You can see our plans for improvements [here](https://tree.taiga.io/project/shift2bikes-shift-calendar/)

## How to make improvements to integration with Facebook

The Facebook app ID is 135930960098034.

## How to propose changes

Please fork the master branch of the [Shift2Bikes/shiftcal](https://github.com/Shift2Bikes/shiftcal) code into a branch in your own account. Commit your changes to that branch, make a pull request against the master branch of Shift2Bikes/shiftcal, and we'll try to merge it!

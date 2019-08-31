# Magical chalk level editor
> The official level editor for our magical-chalk game

## Story
we wanted to bring crayon physics to the web so we made [this](https://github.com/DavidLanderosAlcala/magical-chalk) game, this repo is a fork of an SVG editor that we turned out into our level editor (the result is [here](https://rawgit.com/DavidLanderosAlcala/airconsole-project1/engine-migration/level-editor/index.html))

<p align="center"><img width="600" src="https://user-images.githubusercontent.com/5791055/64069431-1242a500-cbfe-11e9-9699-a27d99c603bf.gif"></p>

## Usage
#### Level scripting

Each level is made of 2 javascript functions:
- __setup__ : called only once when the level is launched
- __update__ : called frame by frame until the level ends

The setup function receives an object called context, this is where the script can store its level-spesific data.
the update function will also receive the same object so it can use it as a persistent storage between frames.

The return value of the update function is key piece in the level life-cycle, it is a bitflag indicating which stars has been unlocked, that means that the level will continue running while the update function returns zero (no stars)

This is an example of a level script that finishes the game in the first frame and gives the player the 3 stars

```javascript
function setup(ctx) {

}

function update(ctx) {
    return FIRST_STAR | SECOND_STAR | THIRD_STAR;
}
```

## Credits
- __Method-Draw__ (SVG editor we forked) https://github.com/methodofaction/Method-Draw
- __Ace__ (A Javascript library for adding a fancy code editor to your web app) https://ace.c9.io/

## License
MIT

## Contributors
Omar Arredondo <hapu.x2@gmail.com>  
David Landeros <dh.landeros08@gmail.com>

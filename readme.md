# Magical chalk level editor
> The official level editor for our magical-chalk game

## Story
we wanted to bring crayon physics to the web so we made [this](https://github.com/DavidLanderosAlcala/magical-chalk) game, this repo is a fork of an SVG editor that we turned out into our level editor (the result is [here](https://rawgit.com/DavidLanderosAlcala/airconsole-project1/engine-migration/level-editor/index.html))

<p align="center"><img width="600" src="https://user-images.githubusercontent.com/5791055/64069851-d280bb00-cc07-11e9-8d93-82393136ff16.gif"></p>

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

In this example, the player wins 3 stars when he/she draws __any__ shape. (Phy is an object that emits events)

```javascript
function setup(ctx) {
    // we create a bitflag with an initial value of Zero
    ctx.stars = 0;

    // since we want to be notified when the player draws something, we subscribe to the event "addBody"
    Phy.on("addBody", ()=> {
      // then we give the player 3 stars inmediatly
      ctx.stars = FIRST_STAR | SECOND_STAR | THIRD_STAR;
    });
}

function update(ctx) {
    // there is nothing to do here but returning the current value of the bitflag
    return ctx.stars;
}
```

There are 2 event emitters that you can use in the level script
- Game
- Physics (a.k.a Phy)

| Game Events        |  Desc.                                                   |
|--------------------|:--------------------------------------------------------:|
| addTack            |  when the player adds a tack                             |
| connectTack        |  when the player connects a tack with other shape        |
| removeTack         |  when the player removes a tack                          |
| deleteDrawing      |  when the player removes a drawing                       |

| Phy events          |  Desc.                                                   |
|---------------------|:--------------------------------------------------------:|
| addBody             |  when the player draws a solid body                      |
| removeBody          |  when the player removes a solid body                    |
| beginContact        |  when a collision occurs                                 |
| endContact          |  when a collision finishes                               |
| beginContactBetween |  when a collision occurs between 2 specific objects      |
| endContactBetween   |  when a collision finishes between 2 specific objects    |

#### Advanced example
This level gives the player 3 stars if he/she manage to crash the object
__ball1__ with the object __ball2__, but it only gives the player a single star if
he/she deletes something

```javascript
function setup(ctx) {

   ctx.deletedSomething = false;
   ctx.bitflag = 0;

   Phy.on("removeBody", () => {
       ctx.deletedSomething = true;
   });

   Phy.on("beginContactBetween", "ball1", "ball2", () => {
       if(ctx.deletedSomething) {
           ctx.bitflag = FIRST_STAR;
       }
       else {
           ctx.bitflag = FIRST_STAR | SECOND_STAR | THIRD_STAR;
       }
   });
}

function update(ctx) {
   return ctx.bitflag;
}
```
#### Those objects also provide some useful functions

| Function                       |  Desc.                                                          |
|--------------------------------|:---------------------------------------------------------------:|
| Game.getTime()                 | Get the time in seconds since the level started                 |
| Game.getDrawnObjectsCount()    | Get the number of object the player has drawn                   |
| Game.getHints()                | Get an array of "hints" so you can manipulate their visibility  |
| Phy.getPosition(handler)       | Get the position of an object (screen space)                    |
| Phy.getAngle(handler)          | Get the angle of an object in radians                           |
| Phy.getAllBodies()             | Get all the objects of the world in an array                    |
| Phy.setPosition(handler, pos ) | Teleports an object to the given position (srceen space)        |
| Phy.setVelocity(handler, vel)  | Set object velocity                                             |
| Phy.setAngle(handler, angle)   | Set object angle in radians                                     |
| Phy.clearForces(handler)       | Remove any force moving an object                               |
| Phy.getBodyByLabel(label)      | Obtiene el handler de un objeto                                 |
| Phy.getBodyByLabel(label)      | Get an object by its label                                      |

## Credits
- [Method-Draw](https://github.com/methodofaction/Method-Draw) - The SVG editor we forked
- [Ace](https://ace.c9.io/) - A Javascript library for adding a fancy code editor to your web app
- [TogetherJS](https://togetherjs.com/) - provided us with realtime collaborative features

## License
MIT

## Contributors
Omar Arredondo <hapu.x2@gmail.com>  
David Landeros <dh.landeros08@gmail.com>

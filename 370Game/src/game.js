class Game {
    constructor(state) {
        this.state = state;
        this.spawnedObjects = [];
        this.collidableObjects = [];
        this.scoreContainer = document.getElementById("score-text");
        this.score = 0;
        this.restart = 0;
        this.speed = 0.5; // Adjust the speed as needed
        this.firstPerson = false;

    }

    async spawnObject(object) {
        const tempObject = await spawnObject(object, this.state);

        // Check the object type and set up collider accordingly
        if (object.type === "cube") {
            this.createSphereCollider(tempObject, 0.05);
        }
        else if (object.type === "Custom") {
            this.createSphereCollider(tempObject, 0.1);
        }
        else if (object.type === "mesh") {
            this.createSphereCollider(tempObject, 0.05);
        }

        return tempObject;
    }

    // example - we can add our own custom method to our game and call it using 'this.customMethod()'
    customMethod() {
        console.log("Custom method!");
    }

    // example - create a collider on our object with various fields we might need (you will likely need to add/remove/edit how this works)
    createSphereCollider(object, radius, onCollide = null) {
        object.collider = {
            type: "SPHERE",
            radius: radius,
            onCollide: onCollide ? onCollide : (otherObject) => {
                console.log(`Collided with ${otherObject.name}`);
            }
        };
        this.collidableObjects.push(object);
    }

    createCubeCollider(object, onCollide = null) {
        object.collider = {
            type: "CUBE",
            scale: vec3.fromValues(),
            onCollide: onCollide ? onCollide : (otherObject) => {
                console.log(`Collided with ${otherObject.name}`);
            }
        };
        this.collidableObjects.push(object);
    }

    // example - function to check if an object is colliding with collidable objects
    checkCollision(object) {
        // loop over all the other collidable objects 
        this.collidableObjects.forEach(otherObject => {
            //console.log(`Checking collision between ${object.name} and ${otherObject.name}`);
            // do a check to see if we have collided, if we have we can call object.onCollide(otherObject) which will
            // call the onCollide we define for that specific object. This way we can handle collisions identically for all
            // objects that can collide but they can do different things (ie. player colliding vs projectile colliding)
            // use the modeling transformation for object and otherObject to transform position into current location


            let position1 = vec3.create();
            vec3.transformMat4(position1, object.model.position, object.modelMatrix);

            let position2 = vec3.create();
            vec3.transformMat4(position2, otherObject.model.position, otherObject.modelMatrix);

            let distance = vec3.distance(position1, position2);
            //console.log(distance)


            if (otherObject.name === "bottomPlane" && object.model.position[1] < otherObject.model.position[1] && this.restart == 0) {
                // Collision with the bottom plane

                object.collider.onCollide(otherObject);
                //console.log("bottom collide")
                this.handleBottomPlaneCollision();
                this.restart = 1;

            } else if (otherObject.name == "enemy" && distance < (object.collider.radius + otherObject.collider.radius + .3) && this.restart == 0) {
                object.collider.onCollide(otherObject);
                //shark ragdolls off lol
                otherObject.constantRotate = true;
                this.handleEnemyCollision(); 
                this.restart = 1;

            } else if (otherObject.name !== object.name && (distance < (object.collider.radius + otherObject.collider.radius))) {
                object.collider.onCollide(otherObject);
                const isSpawnedObject = this.spawnedObjects.includes(otherObject);
                //console.log("Colliding");
                // If it's a spawned object, delete it, increment the score, and update UI
                if (isSpawnedObject) {
                    const index = this.spawnedObjects.indexOf(otherObject);
                    if ((index !== -1) && (otherObject.name.startsWith("fish-"))) {
                        this.spawnedObjects.splice(index, 1);
                        this.score += 1;
                        console.log("After deletion - spawnedObjects:", this.spawnedObjects);
                        removeObject(this.state, otherObject.name);
                        //player speed increased on collision
                        this.speed = 0.8;
                        setTimeout(() => {
                            //wait a second before returning to normal
                            this.speed = 0.5;
                        }, 1000); // 1 second

                    } else if (otherObject.name.startsWith("crate-")) {

                        // If it's a crate object, decrement the score 
                        this.score -= 1;
                        console.log(`Score: ${this.score}`);
                        // Additional actions for crate collision
                        this.spawnedObjects.splice(index, 1);
                        removeObject(this.state, otherObject.name);
                        //player speed decreased on collision
                        this.speed = 0.2;
                        setTimeout(() => {
                            //wait a second before returning to normal
                            this.speed = 0.5;
                        }, 1000); // 1 second

                    } else {
                        console.log("Error: Object not found in spawnedObjects array");
                    }

                    // Update the score on the screen
                    this.scoreContainer.textContent = `Score: ${this.score}`;

                    // Update UI or perform other actions based on the score
                    console.log(`Score: ${this.score}`);
                }
            } else {

            }

        });
    }

    // New method to handle bottom plane collision
    handleBottomPlaneCollision() {
        // Display the score on the screen (you might need to adjust the position)
        this.scoreContainer.style.fontSize = "50px"; // Adjust font size as needed
        this.scoreContainer.textContent = `Game Over! Score: ${this.score}`;
        this.speed = 0;

        // Wait for a few seconds (adjust the time as needed)
        setTimeout(() => {
            // Restart the game
            this.resetGame();
        }, 5000); // 5 seconds
    }

    // New method to handle enemy collision
    handleEnemyCollision() {
        // Display the score on the screen (you might need to adjust the position)
        this.scoreContainer.style.fontSize = "50px"; // Adjust font size as needed
        this.scoreContainer.textContent = `Oh no Shark! Score: ${this.score}`;//this shark text doesnt show idk why//decided to sometimes show now idk....
        this.speed = 0;

        // Wait for a few seconds (adjust the time as needed)
        setTimeout(() => {
            // Restart the game
            this.resetGame();
        }, 5000); // 5 seconds
    }

    // New method to reset the game
    resetGame() {
        document.removeEventListener("keypress", this.handleKeyPress);
        // Reset the score and update the UI
        this.score = 0;
        this.scoreContainer.style.fontSize = "20px"; // Adjust font size as needed
        this.scoreContainer.textContent = `Score: ${this.score}`;

        // Reset the shark's position
        const enemyObject = this.spawnedObjects.find(object => object.name === 'enemy');
        if (enemyObject) {
            //BANDAID 
            //trying to reset collision issue on respawn set the position to out of the track to prevent
            //false detection since removal below isnt removing the shark pos??
            enemyObject.model.position = vec3.fromValues(Math.random() * (2.0 - -2.0) + -2.0, 20, 0.0);
        }

        // Remove all spawned objects
        this.spawnedObjects.forEach(object => removeObject(this.state, object.name));
        this.spawnedObjects = [];
        this.restart = 0;
        this.speed = 0.5;
        // Restart the game logic
        this.onStart();
    }

    handleKeyPress = (e) => {
        e.preventDefault();
        var xMove = 0.5;
        var xMax = -2.5;
        var xMin = 2.5;

        switch (e.key) {
            case "a":
                if (this.firstPerson == false) {
                    if (this.cube.model.position[0] != xMin) {
                        this.cube.translate(vec3.fromValues(xMove, 0, 0));
                    }
                } else if(this.firstPerson == true) {
                    if (this.cube.model.position[0] != xMax) {
                        this.cube.translate(vec3.fromValues(-xMove, 0, 0));
                    }
                }
                break;

            case "d":
                if (this.firstPerson == false) {
                    if (this.cube.model.position[0] != xMax) {
                        this.cube.translate(vec3.fromValues(-xMove, 0, 0));
                    }
                } else if(this.firstPerson == true) {
                    if (this.cube.model.position[0] != xMin) {
                        this.cube.translate(vec3.fromValues(xMove, 0, 0));
                    }
                }
                
                break;

            case "x":
                console.log("x pressed")
                if (this.firstPerson == false) {
                    this.firstPerson = true;
                } else if(this.firstPerson == true) {
                    this.firstPerson = false;
                }
            break;

            default:
                break;
        }
    }


    // runs once on startup after the scene loads the objects
    async onStart() {
        console.log("On start");

        this.firstPerson = false;
        // this just prevents the context menu from popping up when you right click
        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        }, false);

        // example - set an object in onStart before starting our render loop!
        this.cube = getObject(this.state, "Cube1");
        const otherCube = getObject(this.state, "Cube2"); // we wont save this as instance var since we dont plan on using it in update

        this.cube.collisionFlag = 0;

        this.cube.model.position = vec3.fromValues(0, 12, 0);


        // example - create sphere colliders on our two objects as an example, we give 2 objects colliders otherwise
        // no collision can happen
        this.createSphereCollider(this.cube, 0.3, (otherObject) => {
            console.log(`This is a custom collision of ${otherObject.name}`)
        });


        // example - setting up a key press event to move an object in the scene
        document.addEventListener("keypress", this.handleKeyPress);

        //this.customMethod(); // calling our custom method! (we could put spawning logic, collision logic etc in there ;) )

        // example: spawn some stuff before the scene starts
        // for (let i = 0; i < 10; i++) {
        //     for (let j = 0; j < 10; j++) {
        //         for (let k = 0; k < 10; k++) {
        //             spawnObject({
        //                 name: `new-Object${i}${j}${k}`,
        //                 type: "cube",
        //                 material: {
        //                     diffuse: randomVec3(0, 1)
        //                 },
        //                 position: vec3.fromValues(4 - i, 5 - j, 10 - k),
        //                 scale: vec3.fromValues(0.5, 0.5, 0.5)
        //             }, this.state);
        //         }
        //     }
        // }

        //Spawn bottom plane
        const planeObject = await this.spawnObject({
            name: 'bottomPlane',
            type: 'plane',
            material: {
                //diffuse: [0.3, 0.3, 0.3],
                diffuse: [0.2, 0.4, 0.8],//like a blue colour
                ambient: [0.1, 0.1, 0.1],
                specular: [0.7, 0.7, 0.7],
                n: 4,
                //alpha: 1,
                alpha: 0.5,//more transparent
                //shaderType: 4,
                shaderType: 4,
            },
            position: [0, -10.25, 0],  // adjust to set length of the "track"
            scale: [13, 1.5, 2],   // adjusted to fit more with "box" size
            diffuseTexture: 'default.png',
            normalTexture: 'defaultNorm.png', //testing to get a "water" look
            rotation: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            parent: null,
            model: null,
        });

        // Add the plane to the collidable objects list
        this.createCubeCollider(planeObject);

        //Spawn top plane
        const waterPlane = await this.spawnObject({
            name: 'waterPlane',
            type: 'plane',
            material: {
                diffuse: [0.2, 0.4, 0.8],//like a blue colour
                ambient: [0.1, 0.1, 0.1],
                specular: [0.5, 0.5, 0.5],
                n: 25,
                alpha: 0.2,//more transparent
                shaderType: 4,
            },
            position: [0, 0.4, 0.5],  // adjust to set length of the "track"
            scale: [12, 2, 43],   // adjusted to fit more with "box" size
            diffuseTexture: 'default.png',
            normalTexture: 'defaultNorm.png', 
            parent: null,
            model: null,
        });
        //rotate
        waterPlane.rotate('x', -Math.PI / 2);
        

        //Spawn rock start, gives more of a finished? look
        //how ever many to cover
        const rockAmount = 7;
        for (let i = 0; i < rockAmount; i++) {
            //i wanted them to vary in size 
            var rockSize = Math.random() * (0.99 - 0.5) + 0.5;
            let tempObject = await this.spawnObject({
                name: `rockBase${i}`,
                type: "mesh",
                model: "Rock5.obj",
                material: {
                    diffuse: vec3.fromValues(0.361, 0.243, 0.008),
                    ambient: vec3.fromValues(0.3, 0.3, 0.3),
                    specular: vec3.fromValues(0.2, 0.2, 0.2),
                    n: 30, 
                    shaderType: 4,
                    alpha: 1,
                },
                //position them along the x-axis sequentially 
                position: vec3.fromValues(3 - i, 10.7 , 0),
                scale: vec3.fromValues(rockSize, rockSize, rockSize),
                diffuseTexture: 'concreteBricks.jpg',
                normalTexture: 'defaultNorm.jpg',
            }, this.state);
        }


        //Spawn fish objects and they rotate to help visiblity
        for (let i = 0; i < 10; i++) {
            let tempObject = await this.spawnObject({
                name: `fish-Object${i}`,
                constantRotate: true,
                type: "mesh",
                model: "fish.obj",
                material: {
                    diffuse: vec3.fromValues(Math.random(), Math.random(), Math.random(), 1),
                    ambient: vec3.fromValues(0.1, 0.1, 0.1),
                    specular: vec3.fromValues(0.3, 0.3, 0.3),
                    n: 4, 
                    shaderType: 4,
                    alpha: 1,
                },
                position: vec3.fromValues(Math.random() * (2.5 - -2.0) + -2.0, Math.random() * (7 - -9) + -9, 0),
                scale: vec3.fromValues(0.1, 0.1, 0.1),
                diffuseTexture: 'default.png',
                normalTexture: 'checkerNorm.jpg',
                collider: {
                    type: "SPHERE",
                    radius: 0.05, // Adjust the radius based on the fish's scale
                    onCollide: (otherObject) => {
                        console.log(`Collided with ${otherObject.name}`);
                    }
                }
            }, this.state);
            tempObject.collidable = true;
            //fish flagged to spin
            tempObject.constantRotate = true;

            //start of if we want to add lights to fish add a light at that position, would need to remove light on collision
            
            //const fishLight = {
                //position: tempObject.position,
               //colour: tempObject.material.diffuse,
                //strenght: 1.0,
            //};
            //tempObject.light = fishLight;

            this.spawnedObjects.push(tempObject);

        }

        //spawn crates
        for (let i = 0; i < 6; i++) {
            let tempObject = await this.spawnObject({
                name: `crate-Object${i}`,
                type: "cube",
                material: {
                    diffuse: vec3.fromValues(0.8, 0.4, 0.2), //brown colour
                    ambient: vec3.fromValues(0.2, 0.2, 0.2),
                    specular: vec3.fromValues(0.01, 0.01, 0.01),
                    n: 60, 
                    shaderType: 3,
                    alpha: 1,
                },
                position: vec3.fromValues(Math.random() * (2.5 - -2.5) + -2.5, Math.random() * (7 - -10) + -10, 0),
                scale: vec3.fromValues(0.90, 0.90, 0.5),
                diffuseTexture: 'plywood.jpg',
                normalTexture: 'defaultNorm.png',

            }, this.state);
            tempObject.collidable = true;

            //if want crates to spin
            tempObject.constantRotate = false;
            this.spawnedObjects.push(tempObject);

        }

        //spawn shark whale npc enemy...
        let tempObject = await this.spawnObject({
            name: `enemy`,
            type: "mesh",
            model: "shark.obj",
            material: {
                diffuse: vec3.fromValues(0.4, 0.4, 0.7, 1),
                ambient: vec3.fromValues(0.3, 0.3, 0.3),
                specular: vec3.fromValues(0.3, 0.3, 0.3),
                n: 10, 
                shaderType: 3,
                alpha: 1,
            },
            //spawn the enemy further back and have it swim towards player at random x position
            position: vec3.fromValues(Math.random() * (2.0 - -2.0) + -2.0, 2.0, 0.0),
            //shark size
            scale: vec3.fromValues(0.2, 0.2, 0.2),
            diffuseTexture: 'alien.jpg',
            normalTexture: 'sharknormal.jpeg',
        }, this.state);
        tempObject.collidable = true;
        tempObject.rotate('y', -Math.PI / 2);
        tempObject.rotate('z', Math.PI / 2);
        this.spawnedObjects.push(tempObject);

        //otherCube.constantRotate = true; // lets add a flag so we can access it later
        //this.spawnedObjects.push(otherCube); // add these to a spawned objects list

        this.cube.collidable = true;
        otherCube.collidable = true;
        this.cube.onCollide = (object) => { // we can also set a function on an object without defining the function before hand!
            console.log(`I collided with ${object.name}!`);
        };

        console.log(this.collidableObjects);
        // }

        //Set initial positions for the player cube and the shark hoping helps with collision on restart...
        //this.cube.model.position = vec3.fromValues(0, 10, 0);
        //console.log(this.cube);
        //const enemyObject = this.spawnedObjects.find(obj => obj.name === 'enemy');
        //enemyObject.model.position = vec3.fromValues(Math.random() * (2.0 - -2.0) + -2.0, 2.0, 0.0);
    }

    // Runs once every frame non stop after the scene loads
    onUpdate(deltaTime) {
        // TODO - Here we can add game logic, like moving game objects, detecting collisions, you name it. Examples of functions can be found in sceneFunctions

        // example: Rotate a single object we defined in our start method
        //this.otherCube.rotate('x', deltaTime * 0.5);

        // example: Rotate all objects in the scene marked with a flag
        //fish need to rotate or when pushed to spawned objects will need to be rotated to be correct orient
        //this.spawnedObjects.forEach((object) => {
            //if (object.constantRotate) {
               // object.rotate('y', deltaTime * 0.5);
            //}
       // });

        /*Shark movement*/
        const enemyObject = this.spawnedObjects.find(obj => obj.name == 'enemy');

        //spawn the shark again if it reaches the start and cube isnt at the end 
        if (enemyObject.model.position[1] > 9.5 && this.cube.model.position[1] > -7) {
            enemyObject.model.position = vec3.fromValues(Math.random() * (2.5 - -2.5) + -2.5, -6.0, 0.0);
        }

        /* shark moving along x is stuttery would need to do some math for smoother movement
           made the shark spawn random x, x movement not noticeable, speed a bit faster than cube
           maybe if it was a random number of t moves and shark moves that direction t times it would be smoother
           than just left and right rapidly*/
        if (enemyObject) {
            //decide if shark moves left -1 or right 1
            //const enemySteps = Math.floor(Math.random() * 7); 
            const enemySteps = 1;
            const enemyDirection = Math.floor(Math.random() * 2); //1 or 0

            //speed shark moves
            //faster than cube? same? slower?
            const enemySpeed = 0.5;
            const enemyMove = 0.0; //size of the step 

            //check that shark is in the bounds 
            const maxX = 2.5;
            const minX = -2.5;
            //not sure the step and speed to make it look smoother anything high has crazy stutter
            if (enemyObject.model.position[0] > minX && enemyObject.model.position[0] < maxX) {
                if (enemyDirection) {
                    for (let i = 0; i < enemySteps; i++) {
                        //move left 
                        enemyObject.translate(vec3.fromValues(-enemyMove * deltaTime, enemySpeed * deltaTime, 0));
                    }
                } else {
                    for (let i = 0; i < enemySteps; i++) {
                        //move right
                        enemyObject.translate(vec3.fromValues(enemyMove * deltaTime, enemySpeed * deltaTime, 0));
                    }
                }

            }
            //console.log(enemyObject.model.position);
        }

        // Cube constant movement
        this.cube.translate(vec3.fromValues(0, -this.speed * deltaTime, 0));
        const playerCubePosition = this.cube.model.position;

        if (this.firstPerson == false) {
            this.spawnedObjects.forEach((object) => {
                if (object.constantRotate) {
                    object.rotate('y', deltaTime * 0.5);
                }
            });
            const cameraOffset = vec3.fromValues(0, 0, -5); // Adjust the offset as needed
           
            // Set the camera position to follow the player cube with the offset
            const newCameraPosition = vec3.create();
            vec3.add(newCameraPosition, playerCubePosition, cameraOffset);
            
    
            // Update the camera position in the state object
            this.state.camera.position = newCameraPosition;
            //console.log(this.state.camera.front);
            this.state.camera.front = vec3.fromValues(-0.11146621231746856, 0.0069812600340345655, 0.9937437021284383); // Adjust as needed
            this.state.camera.up = vec3.fromValues(0, 1, 0); // Adjust as needed
            
        }else if (this.firstPerson == true){
            this.spawnedObjects.forEach((object) => {
                if (object.constantRotate) {
                    object.rotate('z', deltaTime * 0.5);
                    object.rotate('y', deltaTime * 0.5);
                }
            });
            
            // First-person camera offset (looking downwards)
            const cameraOffsetFirstPerson = vec3.fromValues(0, 0, 0); // Adjust the offset as needed

            // Set the camera position to follow the player cube with the offset
            const newCameraPosition = vec3.create();
            vec3.add(newCameraPosition, playerCubePosition, cameraOffsetFirstPerson);

            // Update the camera position in the state object
            this.state.camera.position = newCameraPosition;

            // Update the camera orientation to make it look down
            this.state.camera.front = vec3.fromValues(0, -1, 0.1);
            this.state.camera.up = vec3.fromValues(0, -1, 0); // Adjust as needed
        }
        

        // simulate a collision between the first spawned object and 'cube' 
        // if (this.spawnedObjects[0].collidable) {
        //     this.spawnedObjects[0].onCollide(this.cube);
        // }

        // example: Rotate all the 'spawned' objects in the scene
        // this.spawnedObjects.forEach((object) => {
        //      object.rotate('y', deltaTime * 0.5);
        // });


        // example - call our collision check method on our cube
        this.checkCollision(this.cube, true);
    }
}

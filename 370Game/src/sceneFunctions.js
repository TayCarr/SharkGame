function getObject(state, name) {
    let objectToFind = null;

    for (let i = 0; i < state.objects.length; i++) {
        if (state.objects[i].name === name) {
            objectToFind = state.objects[i];
            break;
        }
    }

    return objectToFind;
}

async function spawnObject(object, state) {
    if (object.type === "mesh") {
        return await addMesh(object);
    } else if (object.type === "cube") {
        return await addCube(object, state);
    } else if (object.type === "plane") {
        return await addPlane(object, state);
    } else if (object.type.includes("Custom")) {
        return await addCustom(object, state);
    }
}

function randomVec3(min, max) {
    return vec3.fromValues(
        Math.random(min, max),
        Math.random(min, max),
        Math.random(min, max),
    )
}

function removeObject(state, objectName) {
    const indexToRemove = state.objects.findIndex(object => object.name === objectName);

    if (indexToRemove !== -1) {
        const removedObject = state.objects.splice(indexToRemove, 1)[0];

        // If you have any additional cleanup logic, you can perform it here

        return removedObject;
    } else {
        console.warn(`Object with name ${objectName} not found in the state.`);
        return null;
    }
}

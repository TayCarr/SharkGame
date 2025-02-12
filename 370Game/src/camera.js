class Camera {
    constructor(name) {
        this.name = name;
        this.position = vec3.create();
        this.front = vec3.fromValues(0, 0, -1); // Assuming the camera looks along the negative z-axis
        this.up = vec3.fromValues(0, 1, 0);
        this.viewMatrix = mat4.create();
    }

    follow(targetObject) {
        // Set the camera position to be behind and slightly above the target object
        const distanceBehind = 5.0;
        const heightAbove = 2.0;

        vec3.copy(this.position, targetObject.model.position);
        vec3.scaleAndAdd(this.position, this.position, targetObject.model.rotationMatrix[2], -distanceBehind);
        vec3.scaleAndAdd(this.position, this.position, vec3.fromValues(0, 1, 0), heightAbove);

        // Look at the target object
        mat4.lookAt(this.viewMatrix, this.position, targetObject.model.position, this.up);
    }
}

module.exports = Camera;
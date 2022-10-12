import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  private canvasElement!: ElementRef;

  private canvas!: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext | null;

  ngAfterViewInit(): void {
    this.canvas = this.canvasElement.nativeElement;
    this.gl = this.canvas.getContext('webgl2');

    if (!this.gl) {
      throw new Error('Failed to initialize WebGL rendering context.');
    }

    const vertexShaderSource = `#version 300 es
    // An attribute is an input (in) to a vertex shader.
    // It will recieve data from a buffer
    in vec4 a_position;

    // All shaders have a main function
    void main() {
      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }`;

    const fragmentShaderSource = `#version 300 es
    // Fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;

    // We need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant reddish-purple
      outColor = vec4(1, 0, 0.5, 1);
    }`;

    const vertexShader = this.createShader(
      this.gl,
      this.gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl,
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader)
      throw new Error('Something went wrong when trying to create a shader');

    const program = this.createProgram(this.gl, vertexShader, fragmentShader);

    if (!program)
      throw new Error('Something went wrong when tryhing to create a program');

    const positionAttributeLocation = this.gl.getAttribLocation(
      program,
      'a_position'
    );

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // prettier-ignore
    const positions = [
      0, 0.5,
      0.5, -0.5,
      -0.5, -0.5
    ];

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions),
      this.gl.STATIC_DRAW
    );

    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);
    this.gl.enableVertexAttribArray(positionAttributeLocation);

    const size = 2; // 2 components per iteration
    const type = this.gl.FLOAT; // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0; // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    this.gl.canvas.width = this.gl.canvas.clientWidth;
    this.gl.canvas.height = this.gl.canvas.clientHeight;

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear the canvas
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    this.gl.useProgram(program);

    // Bind the attribute/buffer set we want
    this.gl.bindVertexArray(vao);

    // We can finally ask WebGL to execute our GLSL program
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  private createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
  ) {
    const shader = gl.createShader(type);
    if (!shader)
      throw new Error('Something went wrong when trying to create a shader');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;

    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  private createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    const program = gl.createProgram();
    if (!program)
      throw new Error('Something went wrong when trying to create a program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;

    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
}

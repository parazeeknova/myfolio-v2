uniform sampler2D uTexture;
uniform float uPeelProgress;
varying vec2 vUv;
varying float vElevation;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);

  vec3 color = texColor.rgb + vElevation * 0.15;

  gl_FragColor = vec4(color, texColor.a);
}

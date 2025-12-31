uniform float uPeelProgress;
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
  vUv = uv;
  vec3 pos = position;
  float floatOffset = sin(uTime + position.x * 2.0) * 0.05;
  pos.y += floatOffset;
  pos.x += cos(uTime * 0.8 + position.y * 2.0) * 0.03;
  float peelInfluence = smoothstep(1.0 - uPeelProgress, 1.0, uv.y);
  float peelAmount = peelInfluence * uPeelProgress;
  float curlAngle = peelAmount * 3.14159;
  float radius = 0.5;
  pos.y -= peelAmount * 2.0;
  pos.z = sin(curlAngle) * radius * peelInfluence;
  pos.y += (1.0 - cos(curlAngle)) * radius * peelInfluence;
  vElevation = peelAmount;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

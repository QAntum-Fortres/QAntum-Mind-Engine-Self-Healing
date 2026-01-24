export const SingularityShader = {
  uniforms: {
    uTime: { value: 0 },
    uTotalEntities: { value: 2000000000.0 },
    uEvolution: { value: 0.0 },
  },
  vertexShader: `
    attribute float aResonance;
    varying vec3 vColor;
    uniform float uTime;
    uniform float uEvolution;
    
    void main() {
      float i = float(gl_InstanceID);
      float phi = 1.618033988749895;
      float angle = i * phi * 2.0 * 3.14159;
      float radius = sqrt(i / 1000.0) * (0.5 + uEvolution * 0.2);
      
      vec3 pos = vec3(
        cos(angle + uEvolution * 2.0) * radius,
        sin(uTime * (0.2 + uEvolution * 1.0) + i * 0.00001) * (2.0 + uEvolution * 5.0), 
        sin(angle) * radius
      );

      // Color logic influenced by Evolution
      vec3 stableColor = mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 1.0, 1.0), uEvolution);
      
      if (aResonance > 1.5) {
        vColor = vec3(1.0, 1.0, 1.0);
      } else if (aResonance > 0.5) {
        vColor = vec3(1.0, 0.0, 0.2);
      } else {
        vColor = stableColor;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (aResonance > 0.5 ? 4.0 : 2.0) * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, 1.0);
    }
  `
};

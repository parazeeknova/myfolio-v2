import Component from "../classes/component";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createLogoScene,
  startAnimationLoop,
  disposeScene,
} from "./floating-logos-webgl";

gsap.registerPlugin(ScrollTrigger);

export default class FloatingLogos extends Component {
  constructor() {
    super({
      element: ".floating-logos",
      elements: {
        logo1: ".floating-logo-1",
        logo2: ".floating-logo-2",
      },
    });

    this.scenes = [];
    this.renderers = [];
    this.initWebGL();
    this.initAnimation();
  }

  initWebGL() {
    [this.elements.logo1, this.elements.logo2].forEach((logoElement, index) => {
      createLogoScene(logoElement, index, (sceneData) => {
        this.scenes.push(sceneData);
        startAnimationLoop(
          sceneData.scene,
          sceneData.camera,
          sceneData.renderer,
          sceneData.material,
          () => this.isDestroyed
        );
      });
    });
  }

  initAnimation() {
    if (!this.elements.logo1 || !this.elements.logo2) return;

    const heroSection = document.querySelector(".home__hero");
    const scroller = document.querySelector("[data-scroll-container]");
    const checkWebGL = setInterval(() => {
      if (this.scenes.length === 2) {
        clearInterval(checkWebGL);
        this.setupScrollAnimations(heroSection, scroller);
      }
    }, 100);
  }

  setupScrollAnimations(heroSection, scroller) {
    this.scenes.forEach(({ material, mesh }, index) => {
      material.uniforms.uPeelProgress.value = 1.0;
      mesh.scale.set(0.8, 0.8, 0.8);
      mesh.visible = false;

      gsap.to(mesh, {
        visible: true,
        delay: 0.5 + index * 0.1,
        duration: 0,
      });

      gsap.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.9,
        delay: 0.5 + index * 0.1,
        ease: "power4.out",
      });

      gsap.to(material.uniforms.uPeelProgress, {
        value: 0,
        duration: 0.9,
        delay: 0.5 + index * 0.1,
        ease: "power4.out",
      });
    });

    this.scenes.forEach(({ material, mesh }, index) => {
      const logoElement =
        index === 0 ? this.elements.logo1 : this.elements.logo2;

      const getInitialPosition = () => {
        const rect = logoElement.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
        };
      };

      let initialPos = null;
      let isFixed = false;

      ScrollTrigger.create({
        trigger: heroSection,
        scroller: scroller,
        start: "top top",
        end: "bottom+=200% top",
        scrub: 1.5,
        markers: false,
        onUpdate: (self) => {
          const progress = self.progress;

          if (!initialPos && progress > 0) {
            initialPos = getInitialPosition();
          }

          if (progress > 0.05 && !isFixed) {
            logoElement.style.position = "fixed";
            logoElement.style.left = `${initialPos.x}px`;
            logoElement.style.top = `${initialPos.y}px`;
            logoElement.style.transform = "translate(0, 0)";
            isFixed = true;
          }

          // Phase 1 (0-0.2): Peel off
          // Phase 2 (0.2-0.8): Fly through air with twisting/turning
          // Phase 3 (0.8-1.0): Descend and stick to footer

          if (progress < 0.2) {
            const peelProgress = progress / 0.2;
            const easedPeel =
              peelProgress * peelProgress * (3 - 2 * peelProgress);
            material.uniforms.uPeelProgress.value = easedPeel;

            mesh.rotation.x = 0;
            mesh.rotation.y = 0;
            mesh.rotation.z = easedPeel * 0.3 * (index === 0 ? 1 : -1);

            if (isFixed) {
              const xMove = easedPeel * 15 * (index === 0 ? -1 : 1);
              const yMove = easedPeel * -20; // Lift up
              logoElement.style.transform = `translate(${xMove}px, ${yMove}px)`;
            }

            mesh.scale.set(1, 1, 1);
          } else if (progress < 0.8) {
            material.uniforms.uPeelProgress.value = 1.0;

            const flyProgress = (progress - 0.2) / 0.6;

            mesh.rotation.x = Math.sin(flyProgress * Math.PI * 3) * 0.9;
            mesh.rotation.y = Math.sin(flyProgress * Math.PI * 2.3) * 0.6;
            mesh.rotation.z =
              Math.sin(flyProgress * Math.PI * 3.5) * 0.5 +
              (index === 0 ? flyProgress * 1.2 : -flyProgress * 1.2);

            if (isFixed) {
              const xOscillate =
                Math.sin(flyProgress * Math.PI * 2) *
                80 *
                (index === 0 ? -1 : 1);
              const baseX = 15 * (index === 0 ? -1 : 1);
              const viewportHeight = window.innerHeight;
              const yStart = -20;
              const yEnd = viewportHeight * 0.7; // Travel to 70% down the viewport
              const yTravel = yStart + (yEnd - yStart) * flyProgress;
              const yWave = Math.sin(flyProgress * Math.PI * 1.5) * 40;

              logoElement.style.transform = `translate(${baseX + xOscillate}px, ${yTravel + yWave}px)`;
            }

            const scaleVariation =
              1 + Math.sin(flyProgress * Math.PI * 3) * 0.12;
            mesh.scale.set(scaleVariation, scaleVariation, scaleVariation);
          } else {
            const landProgress = (progress - 0.8) / 0.2;
            const easedLand =
              landProgress * landProgress * (3 - 2 * landProgress);
            material.uniforms.uPeelProgress.value = 1.0 - easedLand * 0.8;
            const flyProgress = 1.0;
            const rotationDamping = 1 - easedLand;
            mesh.rotation.x =
              Math.sin(flyProgress * Math.PI * 3) *
              0.9 *
              rotationDamping *
              0.15;
            mesh.rotation.y =
              Math.sin(flyProgress * Math.PI * 2.3) *
              0.6 *
              rotationDamping *
              0.15;
            mesh.rotation.z =
              (Math.sin(flyProgress * Math.PI * 3.5) * 0.5 +
                (index === 0 ? flyProgress * 1.2 : -flyProgress * 1.2)) *
              rotationDamping *
              0.2;

            if (isFixed) {
              const xOscillate =
                Math.sin(flyProgress * Math.PI * 2) *
                80 *
                (index === 0 ? -1 : 1);
              const baseX = 15 * (index === 0 ? -1 : 1);
              const viewportHeight = window.innerHeight;
              const yStart = -20;
              const yEnd = viewportHeight * 0.7;
              const yTravel = yStart + (yEnd - yStart) * flyProgress;
              const yWave = Math.sin(flyProgress * Math.PI * 1.5) * 40;
              const footerOffsetX = index === 0 ? -30 : 50;
              const footerOffsetY = viewportHeight * 0.15;

              const xFinal =
                baseX + xOscillate + (footerOffsetX - xOscillate) * easedLand;
              const yFinal =
                yTravel + yWave + (footerOffsetY - yWave) * easedLand;

              logoElement.style.transform = `translate(${xFinal}px, ${yFinal}px)`;
            }
            const scaleVariation =
              1 + Math.sin(flyProgress * Math.PI * 3) * 0.12;
            const targetScale =
              scaleVariation + (0.7 - scaleVariation) * easedLand;
            mesh.scale.set(targetScale, targetScale, targetScale);
          }
        },
        onLeave: () => {
          if (isFixed) {
            logoElement.style.position = "absolute";
            isFixed = false;
          }
        },
        onEnterBack: () => {
          if (initialPos) {
            logoElement.style.position = "fixed";
            isFixed = true;
          }
        },
      });
    });
  }

  destroy() {
    this.isDestroyed = true;
    const triggers = ScrollTrigger.getAll();
    triggers.forEach((trigger) => {
      trigger.kill();
    });

    if (this.elements.logo1) this.elements.logo1.style.transform = "";
    if (this.elements.logo2) this.elements.logo2.style.transform = "";

    this.scenes.forEach((sceneData) => {
      disposeScene(sceneData);
    });

    this.scenes = [];
    this.renderers = [];
  }
}

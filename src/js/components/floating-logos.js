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
    this.originalParents = [null, null];
    this.initialPositions = [null, null];
    this.lastPositions = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    this.moveLogosToBody();
    this.initWebGL();
    this.initAnimation();
  }

  moveLogosToBody() {
    [this.elements.logo1, this.elements.logo2].forEach((logoElement, index) => {
      if (!logoElement) return;

      this.originalParents[index] = logoElement.parentElement;
      const rect = logoElement.getBoundingClientRect();
      this.initialPositions[index] = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };

      const img = logoElement.querySelector("img");
      if (img) {
        img.style.display = "none";
      }

      document.body.appendChild(logoElement);

      logoElement.style.position = "fixed";
      logoElement.style.left = `${rect.left}px`;
      logoElement.style.top = `${rect.top}px`;
      logoElement.style.zIndex = "9999";
      logoElement.style.pointerEvents = "none";
      logoElement.style.willChange = "transform";
      logoElement.style.transform = "translate3d(0, 0, 0)";
    });
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

  moveBackToParent(logoElement, index) {
    if (!this.originalParents[index]) return;

    this.originalParents[index].appendChild(logoElement);
    logoElement.style.position = "";
    logoElement.style.left = "";
    logoElement.style.top = "";
    logoElement.style.zIndex = "";
    logoElement.style.transform = "";
    logoElement.style.willChange = "";
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  setupScrollAnimations(heroSection, scroller) {
    this.scenes.forEach(({ material, mesh }, index) => {
      material.uniforms.uPeelProgress.value = 1;
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

    const contactSection = document.querySelector(".home__contact");
    const landingPositions = [
      {
        xPercent: 0.03 + Math.random() * 0.18,
        yPercent: -0.15 - Math.random() * 0.35,
        rotation: (Math.random() - 0.5) * 0.3,
      },
      {
        xPercent: 0.72 + Math.random() * 0.2,
        yPercent: -0.2 - Math.random() * 0.4,
        rotation: (Math.random() - 0.5) * 0.3,
      },
    ];

    this.scenes.forEach(({ material, mesh }, index) => {
      const logoElement =
        index === 0 ? this.elements.logo1 : this.elements.logo2;
      const initialPos = this.initialPositions[index];

      if (!initialPos) return;

      ScrollTrigger.create({
        trigger: heroSection,
        scroller: scroller,
        start: "top top",
        endTrigger: contactSection,
        end: "top center",
        scrub: 0.8,
        markers: false,
        onUpdate: (self) => {
          const progress = self.progress;
          const smoothStep = (t) => t * t * (3 - 2 * t);
          const smootherStep = (t) => t * t * t * (t * (t * 6 - 15) + 10);

          let targetX = 0;
          let targetY = 0;

          if (progress < 0.1) {
            // Phase 1: Peel off
            const peelProgress = progress / 0.1;
            const easedPeel = smootherStep(peelProgress);

            material.uniforms.uPeelProgress.value = easedPeel;

            mesh.rotation.x = 0;
            mesh.rotation.y = 0;
            mesh.rotation.z = easedPeel * 0.3 * (index === 0 ? 1 : -1);

            // Zephyr (index 1) moves to the right side of the screen
            // Singularity (index 0) moves slightly left
            const viewportWidth = window.innerWidth;
            if (index === 0) {
              targetX = easedPeel * -15;
              targetY = easedPeel * -20;
            } else {
              // Zephyr moves to right side of screen
              const rightSideX = viewportWidth * 0.75 - initialPos.x;
              targetX = easedPeel * rightSideX;
              targetY = easedPeel * -30;
            }

            mesh.scale.set(1, 1, 1);
          } else if (progress < 0.85) {
            // Phase 2: Flying
            const flyProgress = (progress - 0.1) / 0.75;

            material.uniforms.uPeelProgress.value = 1.0;

            const baseRotZ = 0.3 * (index === 0 ? 1 : -1);
            mesh.rotation.x = Math.sin(flyProgress * Math.PI * 2) * 0.4;
            mesh.rotation.y = Math.sin(flyProgress * Math.PI * 1.5) * 0.3;
            mesh.rotation.z =
              baseRotZ +
              Math.sin(flyProgress * Math.PI * 2.5) * 0.25 +
              (index === 0 ? flyProgress * 0.4 : -flyProgress * 0.4);

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const xOscillate =
              Math.sin(flyProgress * Math.PI * 2) *
              (viewportWidth * 0.06) *
              (index === 0 ? -1 : 1);

            const finalTargetX =
              landingPositions[index].xPercent * viewportWidth;
            // Start from where Phase 1 ended
            let startX, yStart;
            if (index === 0) {
              startX = initialPos.x - 15;
              yStart = initialPos.y - 20;
            } else {
              // Zephyr starts from right side of screen
              startX = viewportWidth * 0.75;
              yStart = initialPos.y - 30;
            }
            const baseX =
              startX + (finalTargetX - startX) * smoothStep(flyProgress);

            const yEnd = viewportHeight * 0.7;
            const yTravel = yStart + (yEnd - yStart) * smoothStep(flyProgress);
            const yWave = Math.sin(flyProgress * Math.PI * 1.5) * 20;

            targetX = baseX + xOscillate - initialPos.x;
            targetY = yTravel + yWave - initialPos.y;

            mesh.scale.set(1, 1, 1);
          } else {
            // Phase 3: Landing and sticking
            const landProgress = (progress - 0.85) / 0.15;
            const easedLand = smootherStep(landProgress);
            material.uniforms.uPeelProgress.value = 1.0 - easedLand;

            const baseRotZ = 0.3 * (index === 0 ? 1 : -1);
            const flyEndRotX = Math.sin(Math.PI * 2) * 0.4;
            const flyEndRotY = Math.sin(Math.PI * 1.5) * 0.3;
            const flyEndRotZ =
              baseRotZ +
              Math.sin(Math.PI * 2.5) * 0.25 +
              (index === 0 ? 0.4 : -0.4);

            const rotationDamping = 1 - easedLand;
            const finalRotation = landingPositions[index].rotation;

            mesh.rotation.x = flyEndRotX * rotationDamping * 0.15;
            mesh.rotation.y = flyEndRotY * rotationDamping * 0.15;
            mesh.rotation.z =
              flyEndRotZ * rotationDamping * 0.2 + finalRotation * easedLand;

            if (contactSection) {
              const contactRect = contactSection.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;

              const flyEndX =
                landingPositions[index].xPercent * viewportWidth - initialPos.x;
              const flyEndY = viewportHeight * 0.7 - initialPos.y;

              const landingX =
                contactRect.left +
                contactRect.width * landingPositions[index].xPercent;
              const landingY =
                contactRect.top +
                contactRect.height * landingPositions[index].yPercent;
              const finalX = landingX - initialPos.x;
              const finalY = landingY - initialPos.y;

              targetX = flyEndX + (finalX - flyEndX) * easedLand;
              targetY = flyEndY + (finalY - flyEndY) * easedLand;
            }

            mesh.scale.set(1, 1, 1);
          }

          this.lastPositions[index].x = this.lerp(
            this.lastPositions[index].x,
            targetX,
            0.25
          );
          this.lastPositions[index].y = this.lerp(
            this.lastPositions[index].y,
            targetY,
            0.25
          );
          logoElement.style.transform = `translate3d(${this.lastPositions[index].x}px, ${this.lastPositions[index].y}px, 0)`;
        },
        onLeave: () => {
          // Keep visible when scrolled past
        },
        onEnterBack: () => {
          // Continue animation when scrolling back
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

    if (this.elements.logo1) {
      this.moveBackToParent(this.elements.logo1, 0);
    }
    if (this.elements.logo2) {
      this.moveBackToParent(this.elements.logo2, 1);
    }

    this.scenes.forEach((sceneData) => {
      disposeScene(sceneData);
    });

    this.scenes = [];
    this.renderers = [];
  }
}

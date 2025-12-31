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
        logo3: ".floating-logo-3",
      },
    });

    this.scenes = [];
    this.renderers = [];
    this.originalParents = [null, null, null];
    this.initialPositions = [null, null, null];
    this.lastPositions = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ];
    this.moveLogosToBody();
    this.initWebGL();
    this.initAnimation();
  }

  moveLogosToBody() {
    [this.elements.logo1, this.elements.logo2, this.elements.logo3].forEach(
      (logoElement, index) => {
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
      }
    );
  }

  initWebGL() {
    [this.elements.logo1, this.elements.logo2, this.elements.logo3].forEach(
      (logoElement, index) => {
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
      }
    );
  }

  initAnimation() {
    if (!this.elements.logo1 || !this.elements.logo2 || !this.elements.logo3)
      return;

    const heroSection = document.querySelector(".home__hero");
    const scroller = document.querySelector("[data-scroll-container]");
    const checkWebGL = setInterval(() => {
      if (this.scenes.length === 3) {
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
    const isMobile = window.innerWidth < 768;
    const landingPositions = isMobile
      ? [
          {
            xPercent: 0 + Math.random() * 0.05,
            yPercent: 0.15 + Math.random() * 0.1,
            rotation: (Math.random() - 0.5) * 0.4,
          },
          {
            xPercent: 0.02 + Math.random() * 0.05,
            yPercent: 0.28 + Math.random() * 0.1,
            rotation: (Math.random() - 0.5) * 0.4,
          },
          {
            xPercent: -0.02 + Math.random() * 0.06,
            yPercent: 0.55 + Math.random() * 0.1,
            rotation: (Math.random() - 0.5) * 0.4,
          },
        ]
      : [
          // Desktop: Spread out across the section
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
          {
            xPercent: 0.4 + Math.random() * 0.2,
            yPercent: -0.25 - Math.random() * 0.35,
            rotation: (Math.random() - 0.5) * 0.3,
          },
        ];

    this.scenes.forEach(({ material, mesh }, index) => {
      const logoElements = [
        this.elements.logo1,
        this.elements.logo2,
        this.elements.logo3,
      ];
      const logoElement = logoElements[index];
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

          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const mobileScale =
            viewportWidth < 768 ? 0.6 : viewportWidth < 1024 ? 0.8 : 1;

          let targetX = 0;
          let targetY = 0;

          if (progress < 0.1) {
            const peelProgress = progress / 0.1;
            const easedPeel = smootherStep(peelProgress);

            material.uniforms.uPeelProgress.value = easedPeel;
            mesh.rotation.x = 0;
            mesh.rotation.y = 0;
            mesh.rotation.z = easedPeel * 0.3 * (index === 0 ? 1 : -1);

            const peelOffsetX = viewportWidth * 0.015 * mobileScale;
            const peelOffsetY = viewportHeight * 0.025 * mobileScale;

            if (index === 0) {
              targetX = easedPeel * -peelOffsetX;
              targetY = easedPeel * -peelOffsetY;
            } else if (index === 1) {
              const rightSideX = viewportWidth * 0.75 - initialPos.x;
              targetX = easedPeel * rightSideX * mobileScale;
              targetY = easedPeel * -peelOffsetY * 1.2;
            } else {
              const leftSideX = viewportWidth * 0.15 - initialPos.x;
              targetX = easedPeel * leftSideX * mobileScale;
              targetY = easedPeel * -peelOffsetY;
            }

            mesh.scale.set(1, 1, 1);
          } else if (progress < 0.85) {
            const flyProgress = (progress - 0.1) / 0.75;
            const peelFrequency = 2 + index * 0.5;
            const peelOscillation =
              Math.sin(flyProgress * Math.PI * peelFrequency) * 0.15;
            material.uniforms.uPeelProgress.value = 0.85 + peelOscillation;

            const baseRotZ = 0.3 * (index === 0 ? 1 : -1);
            mesh.rotation.x =
              Math.sin(flyProgress * Math.PI * 2) * 0.4 * mobileScale;
            mesh.rotation.y =
              Math.sin(flyProgress * Math.PI * 1.5) * 0.3 * mobileScale;
            mesh.rotation.z =
              baseRotZ +
              Math.sin(flyProgress * Math.PI * 2.5) * 0.25 +
              (index === 0 ? flyProgress * 0.4 : -flyProgress * 0.4);

            // Responsive oscillation
            const xOscillate =
              Math.sin(flyProgress * Math.PI * 2) *
              (viewportWidth * 0.04 * mobileScale) *
              (index === 0 ? -1 : 1);

            const finalTargetX =
              landingPositions[index].xPercent * viewportWidth;

            // Responsive start positions
            const peelOffsetX = viewportWidth * 0.015 * mobileScale;
            const peelOffsetY = viewportHeight * 0.025 * mobileScale;

            let startX, yStart;
            if (index === 0) {
              startX = initialPos.x - peelOffsetX;
              yStart = initialPos.y - peelOffsetY;
            } else if (index === 1) {
              startX =
                viewportWidth * 0.75 * mobileScale +
                viewportWidth * 0.25 * (1 - mobileScale);
              yStart = initialPos.y - peelOffsetY * 1.2;
            } else {
              startX = viewportWidth * 0.15;
              yStart = initialPos.y - peelOffsetY;
            }
            const baseX =
              startX + (finalTargetX - startX) * smoothStep(flyProgress);

            const yEnd = viewportHeight * 0.7;
            const yTravel = yStart + (yEnd - yStart) * smoothStep(flyProgress);
            const yWave =
              Math.sin(flyProgress * Math.PI * 1.5) * (20 * mobileScale);

            targetX = baseX + xOscillate - initialPos.x;
            targetY = yTravel + yWave - initialPos.y;

            mesh.scale.set(1, 1, 1);
          } else {
            const landProgress = (progress - 0.85) / 0.15;
            const easedLand = smootherStep(landProgress);
            const flyEndPeel = 0.85;
            material.uniforms.uPeelProgress.value =
              flyEndPeel * (1 - easedLand);

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
    if (this.elements.logo3) {
      this.moveBackToParent(this.elements.logo3, 2);
    }

    this.scenes.forEach((sceneData) => {
      disposeScene(sceneData);
    });

    this.scenes = [];
    this.renderers = [];
  }
}

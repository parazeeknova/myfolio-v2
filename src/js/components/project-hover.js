import Component from "../classes/component";
import gsap from "gsap";

export default class ProjectHover extends Component {
  constructor() {
    super({
      element: ".home__projects",
      elements: {
        projects: ".home__projects__project__link[data-project-image]",
        line: ".home__projects__line.left",
      },
    });

    this.isHovering = false;
    this.imageContainer = null;
    this.floatingLogosInstance = null;

    this.init();
  }

  init() {
    if (!this.elements.projects) {
      return;
    }

    this.createImageContainer();

    const projectLinks = Array.isArray(this.elements.projects)
      ? this.elements.projects
      : [this.elements.projects];

    projectLinks.forEach((project) => {
      this.setupProjectHover(project);
    });
  }

  createImageContainer() {
    this.imageContainer = document.createElement("div");
    this.imageContainer.className = "project-hover-image";
    this.imageContainer.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      opacity: 0;
      will-change: transform, opacity;
    `;
    document.body.appendChild(this.imageContainer);
  }

  setupProjectHover(projectElement) {
    const imageUrl = projectElement.getAttribute("data-project-image");

    if (!imageUrl) {
      return;
    }

    const isDesktop = window.innerWidth > 1024;
    if (!isDesktop) {
      return;
    }

    projectElement.addEventListener("mouseenter", (e) => {
      this.showProjectImage(imageUrl, e);
    });

    projectElement.addEventListener("mousemove", (e) => {
      this.moveProjectImage(e);
    });
    // Mouse leave
    projectElement.addEventListener("mouseleave", () => {
      this.hideProjectImage();
    });
  }

  showProjectImage(imageUrl, event) {
    if (this.isHovering) return;
    this.isHovering = true;

    this.imageContainer.innerHTML = "";

    const newImg = document.createElement("img");
    newImg.src = imageUrl;
    newImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;

    this.imageContainer.appendChild(newImg);

    const isMobile = window.innerWidth < 768;
    const imageSize = isMobile ? 200 : 350;
    const offsetX = 30;
    const offsetY = -50;
    const initialX = event.clientX + offsetX;
    const initialY = event.clientY + offsetY;

    gsap.set(this.imageContainer, {
      width: imageSize,
      height: imageSize * 0.7,
      left: initialX,
      top: initialY,
    });

    gsap.to(this.imageContainer, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
    });

    this.moveLogosAside();
  }

  moveProjectImage(e) {
    if (!this.isHovering) return;

    const x = e.clientX;
    const y = e.clientY;

    const offsetX = 30;
    const offsetY = -50;

    gsap.to(this.imageContainer, {
      left: x + offsetX,
      top: y + offsetY,
      duration: 0.8,
      ease: "power2.out",
    });
  }

  hideProjectImage() {
    if (!this.isHovering) return;
    this.isHovering = false;

    gsap.to(this.imageContainer, {
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      ease: "power2.in",
    });

    this.restoreLogos();
  }

  moveLogosAside() {
    const logo1 = document.querySelector(".floating-logo-1");
    const logo2 = document.querySelector(".floating-logo-2");
    const logo3 = document.querySelector(".floating-logo-3");

    if (!logo1 || !logo2 || !logo3) return;

    const isMobile = window.innerWidth < 768;
    const displacement = isMobile ? 120 : 200;

    if (!logo1.dataset.originalTransform) {
      logo1.dataset.originalTransform = logo1.style.transform || "";
      logo2.dataset.originalTransform = logo2.style.transform || "";
      logo3.dataset.originalTransform = logo3.style.transform || "";
    }

    gsap.to(logo1, {
      x: `-=${displacement}`,
      y: `-=${displacement * 0.5}`,
      rotation: -15,
      scale: 0.85,
      duration: 0.8,
      ease: "power3.out",
    });

    gsap.to(logo2, {
      x: `+=${displacement}`,
      y: `-=${displacement * 0.6}`,
      rotation: 12,
      scale: 0.85,
      duration: 0.8,
      ease: "power3.out",
    });

    gsap.to(logo3, {
      x: `-=${displacement * 0.7}`,
      y: `+=${displacement * 0.4}`,
      rotation: -10,
      scale: 0.85,
      duration: 0.8,
      ease: "power3.out",
    });
  }

  restoreLogos() {
    const logo1 = document.querySelector(".floating-logo-1");
    const logo2 = document.querySelector(".floating-logo-2");
    const logo3 = document.querySelector(".floating-logo-3");

    if (!logo1 || !logo2 || !logo3) return;

    gsap.to(logo1, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "power3.inOut",
    });

    gsap.to(logo2, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "power3.inOut",
    });

    gsap.to(logo3, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.8,
      ease: "power3.inOut",
    });
  }

  destroy() {
    if (this.imageContainer) {
      this.imageContainer.remove();
    }
  }
}

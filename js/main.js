const AnimationState = {
  HERO: "hero",
  EXPLORE: "explore",
  RESULT: "result",
  MODAL: "modal",
};

class PageAnimator {
  constructor(config) {
    this.config = {
      ease: "power3.out",
      touchThreshold: 30,
      ...config,
    };

    this.state = AnimationState.HERO;
    this.previousState = null;
    this.isAnimating = false;
    this.touchStartY = 0;
    this.touchHandled = false;

    this.elements = this.initializeElements();

    this._handleWheel = this.handleWheel.bind(this);
    this._handleTouchStart = this.handleTouchStart.bind(this);
    this._handleTouchMove = this.handleTouchMove.bind(this);
    this._handleResize = this.handleResize.bind(this);

    this.init();
  }

  initializeElements() {
    const selectors = {
      logo: ".header__logo",
      header: ".header",
      hero: ".hero",
      overlay: ".page__overlay",
      modal: "#modal",
      modalForm: "#modalForm",
      modalClose: "#modalClose",
      modalBackdrop: ".modal__backdrop",
      modalWindow: ".modal__window",
      result: "#result",
      footer: "#footer",
      exploreNav: "#exploreNav",
      pageWrapper: ".page__content",
    };

    const elements = {};

    for (const [key, selector] of Object.entries(selectors)) {
      elements[key] = document.querySelector(selector);
    }

    elements.heroItems = [
      document.querySelector(".hero__eyebrow"),
      document.querySelector(".hero__title"),
      document.querySelector(".hero__divider"),
      document.querySelector(".hero__text"),
      document.querySelector(".hero__btn"),
    ].filter(Boolean);

    return elements;
  }

  init() {
    this.setInitialState();
    this.bindEvents();
  }

  computeLogoOffset() {
    const { logo } = this.elements;
    if (!logo) return 0;
    const logoRect = logo.getBoundingClientRect();
    return window.innerHeight / 2 - logoRect.top - logoRect.height / 2;
  }

  setInitialState() {
    const { logo, overlay, heroItems } = this.elements;
    if (!logo || !overlay) return;

    const offsetY = this.computeLogoOffset();

    gsap.set(heroItems, { opacity: 0 });

    gsap.fromTo(
      overlay,
      { opacity: 0.85 },
      { opacity: 0, duration: 2.5, ease: "power2.inOut" },
    );

    gsap.fromTo(
      logo,
      { opacity: 0, y: offsetY, scale: 2.5 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 2.5,
        delay: 0.3,
        ease: this.config.ease,
        onComplete: () => this.animateHeroEntrance(),
      },
    );
  }

  animateHeroEntrance() {
    const { heroItems } = this.elements;
    const [eyebrow, title, divider, text, btn] = heroItems;

    gsap.fromTo(
      [eyebrow, title].filter(Boolean),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: this.config.ease },
    );

    if (divider) {
      gsap.fromTo(
        divider,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.6, ease: this.config.ease },
      );
    }

    gsap.fromTo(
      [text, btn].filter(Boolean),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.35, delay: 1.1, ease: this.config.ease },
    );
  }

  bindEvents() {
    const { modalClose, modalBackdrop, modalForm, heroItems } = this.elements;

    const btn = heroItems[heroItems.length - 1];
    btn?.addEventListener("click", () => this.openModal());

    modalClose?.addEventListener("click", () => this.closeModalAndRestore());
    modalBackdrop?.addEventListener("click", () => this.closeModalAndRestore());

    modalForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (this.state === AnimationState.MODAL) {
        this.showResult();
      }
    });

    window.addEventListener("wheel", this._handleWheel, { passive: true });
    document.addEventListener("touchstart", this._handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", this._handleTouchMove, {
      passive: true,
    });

    window.addEventListener("resize", this._handleResize);
  }

  destroy() {
    window.removeEventListener("wheel", this._handleWheel);
    document.removeEventListener("touchstart", this._handleTouchStart);
    document.removeEventListener("touchmove", this._handleTouchMove);
    window.removeEventListener("resize", this._handleResize);
    gsap.killTweensOf("*");
  }

  handleResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      if (this.state === AnimationState.HERO) {
      }
    }, 150);
  }

  handleWheel(e) {
    if (e.deltaY > 0) {
      this.handleScrollDown();
    } else if (e.deltaY < 0) {
      this.handleScrollUp();
    }
  }

  handleTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
    this.touchHandled = false;
  }

  handleTouchMove(e) {
    if (this.touchHandled) return;

    const delta = this.touchStartY - e.touches[0].clientY;

    if (delta > this.config.touchThreshold) {
      this.handleScrollDown();
      this.touchHandled = true;
    } else if (delta < -this.config.touchThreshold) {
      this.handleScrollUp();
      this.touchHandled = true;
    }
  }

  handleScrollDown() {
    if (this.isAnimating) return;
    if (this.state === AnimationState.RESULT) return;
    if (this.state === AnimationState.HERO) this.showExplore();
  }

  handleScrollUp() {
    if (this.isAnimating) return;
    if (this.state === AnimationState.HERO) return;
    if (this.state === AnimationState.EXPLORE) this.returnToHero();
    if (this.state === AnimationState.RESULT) this.returnToHero();
  }

  openModal() {
    if (this.state === AnimationState.MODAL) return;

    this.previousState = this.state;
    this.state = AnimationState.MODAL;

    const { modal, modalBackdrop, modalWindow, logo, heroItems } =
      this.elements;

    modal?.classList.add("modal--open");
    gsap.to(
      [logo, ...heroItems, this.elements.hero, this.elements.header].filter(
        Boolean,
      ),
      {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      },
    );
    gsap.to(modalBackdrop, { opacity: 1, duration: 0.35, ease: "power2.out" });
    gsap.to(modalWindow, {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: "power3.out",
    });
  }

  closeModal() {
    const { modalBackdrop, modalWindow, modal } = this.elements;

    gsap.to(modalBackdrop, { opacity: 0, duration: 0.3, ease: "power2.in" });

    gsap.to(modalWindow, {
      opacity: 0,
      scale: 0.94,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => modal?.classList.remove("modal--open"),
    });
  }

  closeModalAndRestore() {
    this.closeModal();

    const restored = this.previousState || AnimationState.HERO;
    this.previousState = null;
    this.state = restored;

    if (restored === AnimationState.HERO) {
      const { logo, heroItems, hero, header } = this.elements;

      hero.style.display = "";

      gsap.to([logo, ...heroItems, hero, header].filter(Boolean), {
        opacity: 1,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      });
    }
  }

  showExplore() {
    if (this.state !== AnimationState.HERO) return;

    this.isAnimating = true;
    this.previousState = this.state;
    this.state = AnimationState.EXPLORE;

    const { heroItems, logo, hero, header, exploreNav, footer } = this.elements;

    gsap.to(heroItems, {
      y: -60,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      stagger: 0.1,
      onComplete: () => {
        if (typeof Flip !== "undefined") {
          const flipState = Flip.getState(logo);

          hero.style.display = "none";
          header?.classList.add("header--explore");
          exploreNav?.classList.add("explore-nav--visible");

          Flip.from(flipState, {
            duration: 1.2,
            ease: "power3.inOut",
            onComplete: () => {
              this.isAnimating = false;
            },
          });
        } else {
          const beforeRect = logo.getBoundingClientRect();

          hero.style.display = "none";
          header?.classList.add("header--explore");
          exploreNav?.classList.add("explore-nav--visible");

          const afterRect = logo.getBoundingClientRect();
          const layoutDiff = beforeRect.top - afterRect.top;

          gsap.fromTo(
            logo,
            { y: layoutDiff },
            {
              y: 0,
              duration: 1.2,
              ease: "power3.inOut",
              onComplete: () => {
                this.isAnimating = false;
              },
            },
          );
        }

        gsap.fromTo(
          exploreNav,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: 0.95,
            ease: this.config.ease,
          },
        );

        footer?.classList.add("footer--visible");
        gsap.fromTo(
          footer,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: 1.1,
            ease: this.config.ease,
          },
        );
      },
    });
  }

  returnToHero() {
    if (
      this.state !== AnimationState.EXPLORE &&
      this.state !== AnimationState.RESULT
    )
      return;

    const comingFromResult = this.state === AnimationState.RESULT;

    this.isAnimating = true;
    this.state = AnimationState.HERO;

    const {
      logo,
      hero,
      header,
      exploreNav,
      footer,
      heroItems,
      result,
      pageWrapper,
    } = this.elements;

    if (comingFromResult) {
      result?.classList.remove("result--visible");
      header?.classList.remove("header--result");
      pageWrapper?.classList.remove("page__content--result");
    }

    exploreNav?.classList.remove("explore-nav--visible");
    footer?.classList.remove("footer--visible");
    gsap.to(footer, { opacity: 0, y: 20, duration: 0.5 });

    if (comingFromResult) {
      hero.style.display = "";

      gsap.fromTo(
        [logo, hero, header, ...heroItems].filter(Boolean),
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          delay: 0.2,
          stagger: 0.08,
          ease: this.config.ease,
          onComplete: () => {
            this.isAnimating = false;
          },
        },
      );
      return;
    }

    if (typeof Flip !== "undefined") {
      const flipState = Flip.getState(logo);

      hero.style.display = "";
      header?.classList.remove("header--explore");

      Flip.from(flipState, {
        duration: 1.2,
        ease: "power3.inOut",
        onComplete: () => {
          this.isAnimating = false;
          gsap.fromTo(
            heroItems,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              stagger: 0.15,
              ease: this.config.ease,
            },
          );
        },
      });
    } else {
      const beforeRect = logo.getBoundingClientRect();

      hero.style.display = "";
      header?.classList.remove("header--explore");

      const afterRect = logo.getBoundingClientRect();
      const layoutDiff = beforeRect.top - afterRect.top;

      gsap.fromTo(
        logo,
        { y: layoutDiff },
        {
          y: 0,
          duration: 1.2,
          ease: "power3.inOut",
          onComplete: () => {
            this.isAnimating = false;
            gsap.fromTo(
              heroItems,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                stagger: 0.15,
                ease: this.config.ease,
              },
            );
          },
        },
      );
    }
  }

  showResult() {
    if (this.state !== AnimationState.MODAL) {
      return;
    }

    this.closeModal();
    this.previousState = AnimationState.HERO;
    this.state = AnimationState.RESULT;

    const { hero, result, footer, header, pageWrapper, logo } = this.elements;

    gsap.to(hero, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        hero.style.display = "none";
      },
    });

    result?.classList.add("result--visible");
    footer?.classList.add("footer--visible");
    header?.classList.add("header--result");
    pageWrapper?.classList.add("page__content--result");
    gsap.set(result, { opacity: 0 });

    const resultEyebrow = result?.querySelector(".result__eyebrow");
    const resultTitle = result?.querySelector(".result__title");
    const resultTexts = result?.querySelectorAll(".result__text");
    const resultNav = result?.querySelector(".result__nav");

    gsap.fromTo(
      logo,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.5, ease: this.config.ease },
    );
    gsap.fromTo(
      result,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, delay: 0.5, ease: this.config.ease },
    );
    gsap.fromTo(
      resultEyebrow,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.0, delay: 0.6, ease: this.config.ease },
    );
    gsap.fromTo(
      resultTitle,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 1.0, delay: 0.85, ease: this.config.ease },
    );
    gsap.fromTo(
      resultTexts,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        delay: 1.1,
        stagger: 0.15,
        ease: this.config.ease,
      },
    );
    gsap.fromTo(
      resultNav,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1.0, delay: 1.4, ease: this.config.ease },
    );
    gsap.fromTo(
      footer,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.9, delay: 1.6, ease: this.config.ease },
    );
  }

  returnToExplore() {
    if (this.state !== AnimationState.RESULT) return;

    this.state = AnimationState.EXPLORE;

    const { result, footer, header, pageWrapper, logo, exploreNav } =
      this.elements;

    result?.classList.remove("result--visible");
    header?.classList.remove("header--result");
    pageWrapper?.classList.remove("page__content--result");

    exploreNav?.classList.add("explore-nav--visible");
    footer?.classList.add("footer--visible");

    gsap.fromTo(
      logo,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: this.config.ease },
    );
    gsap.fromTo(
      exploreNav,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.9, ease: this.config.ease },
    );
    gsap.fromTo(
      footer,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: this.config.ease },
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Flip !== "undefined") {
    gsap.registerPlugin(Flip);
  }

  window.__pageAnimator = new PageAnimator({ ease: "power3.out" });
});

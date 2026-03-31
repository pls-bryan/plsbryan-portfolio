export type MaeSliceConfig = {
  id: "events" | "contact" | "join" | "merch" | "about";
  label: string;
  href: string;
  path: string;
  imageSrc: string;
  image: {
    x: number;
    y: number;
    width: number;
    height: number;
    preserveAspectRatio?: string;
  };
  text: {
    x: number;
    y: number;
    rotation: number;
    fontSize: number;
    textAnchor?: "start" | "middle" | "end";
    letterSpacing?: string;
  };
};

export const maeScaffoldViewBox = {
  width: 1512,
  height: 758
};

export const maeBadgeConfig = {
  cx: 780.5,
  cy: 104.5,
  r: 104,
  image: {
    src: "/mae/assets/mta-logo-original.PNG.png",
    x: 676.5,
    y: 0.5,
    width: 208,
    height: 208,
    preserveAspectRatio: "xMidYMid slice"
  }
};

export const maeSliceConfigs: MaeSliceConfig[] = [
  {
    id: "join",
    label: "Join",
    href: "/mae/join",
    path: "M983.7,758.5,809.5,221.07a120.24,120.24,0,0,1-56.24.19l-175,537.24Z",
    imageSrc: "/mae/images/mae_join_slide.JPEG",
    image: {
      x: 580,
      y: 180,
      width: 430 * 1.2,
      height: 590 * 1.2,
      preserveAspectRatio: "xMidYMid slice"
    },
    text: {
      x: 777,
      y: 642,
      rotation: 0,
      fontSize: 104,
      textAnchor: "middle",
      letterSpacing: "-0.03em"
    }
  },
  {
    id: "about",
    label: "About",
    href: "/mae/about",
    path: "M882.6,167.93l586.9,427V104.5h-569c0,.17,0,.33,0,.5A119,119,0,0,1,882.6,167.93Z",
    imageSrc: "/mae/images/mae_about_slide.jpeg",
    image: {
      x: 845,
      y: 88,
      width: 690,
      height: 460,
      preserveAspectRatio: "xMidYMid slice"
    },
    text: {
      x: 1306,
      y: 465,
      rotation: 36,
      fontSize: 88,
      textAnchor: "middle",
      letterSpacing: "-0.03em"
    }
  },
  {
    id: "merch",
    label: "Merch",
    href: "/mae/merch",
    path: "M872,182.47a119.9,119.9,0,0,1-45.37,33l176,543H1469.5V617.23Z",
    imageSrc: "/mae/images/mae_merch_slide.jpg",
    image: {
      x: 830,
      y: 185,
      width: 550 * 1.2,
      height: 640 * 1.2,
      preserveAspectRatio: "xMidYMid slice"
    },
    text: {
      x: 965,
      y: 600,
      rotation: 71,
      fontSize: 94,
      textAnchor: "middle",
      letterSpacing: "-0.03em"
    }
  },
  {
    id: "contact",
    label: "Contact",
    href: "/mae/contact",
    path: "M736.12,215.78a119.86,119.86,0,0,1-45.83-33L38.5,655.64V758.5H559.35Z",
    imageSrc: "/mae/images/mae_contact_slide.jpeg",
    image: {
      x: 18,
      y: 180,
      width: 785 * 1.05,
      height: 600 * 1.05,
      preserveAspectRatio: "xMidYMid slice"
    },
    text: {
      x: 600,
      y: 600,
      rotation: -71,
      fontSize: 94,
      textAnchor: "middle",
      letterSpacing: "-0.03em"
    }
  },
  {
    id: "events",
    label: "Events",
    href: "/mae/events",
    path: "M679.63,168.29A118.9,118.9,0,0,1,661.5,105c0-.17,0-.33,0-.5H38.5V633.4Z",
    imageSrc: "/mae/images/mae_events_slide.jpeg",
    image: {
      x: 10,
      y: 82,
      width: 680,
      height: 505,
      preserveAspectRatio: "xMidYMid slice"
    },
    text: {
      x: 250,
      y: 465,
      rotation: -36,
      fontSize: 98,
      textAnchor: "middle",
      letterSpacing: "-0.03em"
    }
  }
];

import { Component, h, Prop, State, VNodeData } from '@stencil/core';


@Component({
  tag: 'ion-icon',
  styleUrls: {
    ios: 'icon.ios.scss',
    md: 'icon.md.scss',
    wp: 'icon.wp.scss'
  },
  host: {
    theme: 'icon'
  }
})
export class Icon {
  mode: string;

  @Prop() color: string;

  /**
   * @input {string} Specifies the label to use for accessibility. Defaults to the icon name.
   */
  @State() label: string = '';

  /**
   * @input {string} Specifies the svg to use for the icon.
   */
  @State() iconSvg: string = '';

  /**
   * @input {string} Specifies which icon to use. The appropriate icon will be used based on the mode.
   * For more information, see [Ionicons](/docs/ionicons/).
   */
  @Prop() name: string = '';

  /**
   * @input {string} Specifies which icon to use on `ios` mode.
   */
  @Prop() ios: string = '';

  /**
   * @input {string} Specifies which icon to use on `md` mode.
   */
  @Prop() md: string = '';

  /**
   * @input {boolean} If true, the icon is styled with an "active" appearance.
   * An active icon is filled in, and an inactive icon is the outline of the icon.
   * The `isActive` property is largely used by the tabbar. Only affects `ios` icons.
   */
  @Prop() isActive: boolean = null;

  /**
   * @input {boolean} If true, the icon is hidden.
   */
  @Prop() hidden: boolean = false;

  /**
   *
   * @input {string} Path to the svg files for icons
   */
  @Prop() assetsDir: string = 'src'


  @State() svgContent: string = null;


  getSvgUrl() {
    const iconName = this.iconName;
    if (iconName !== null) {
      return `${this.assetsDir}/${iconName}.svg`;
    }

    return null;
  }


  get iconName() {
    let iconName: string;

    // if no name was passed set iconName to null
    if (!this.name) {
      return null;
    }

    if (!(/^md-|^ios-|^logo-/.test(this.name))) {
      // this does not have one of the defaults
      // so lets auto add in the mode prefix for them
      iconName = this.mode + '-' + this.name;

    } else if (this.name) {
      // this icon already has a prefix
      iconName = this.name;
    }

    // if an icon was passed in using the ios or md attributes
    // set the iconName to whatever was passed in
    if (this.ios && this.mode === 'ios') {
      iconName = this.ios;

    } else if (this.md && this.mode === 'md') {
      iconName = this.md;
    }

    return iconName;
  }


  hostData(): VNodeData {
    const attrs: {[attrName: string]: string} = {
      'role': 'img'
    };

    if (this.hidden) {
      // adds the hidden attribute
      attrs['hidden'] = '';
    }

    if (this.label) {
      // user provided label
      attrs['aria-label'] = this.label;

    } else {
      // come up with the label based on the icon name
      const iconName = this.iconName;
      if (iconName) {
        attrs['aria-label'] = iconName
                                .replace('ios-', '')
                                .replace('md-', '')
                                .replace('-', ' ');
      }
    }

    return {
      attrs
    };
  }


  loadSvgContent(svgUrl: string) {
    IonIcon.loadCallbacks[svgUrl] = IonIcon.loadCallbacks[svgUrl] || [];

    IonIcon.loadCallbacks[svgUrl].push((loadedSvgContent: string) => {
      this.svgContent = loadedSvgContent;
    });

    if (IonIcon.activeRequests[svgUrl]) {
      return;
    }

    IonIcon.activeRequests[svgUrl] = true;

    console.log('request', svgUrl)

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {

      if (this.status > 203) {
        console.error('Icon could not be loaded:', svgUrl);
        return;
      }

      IonIcon.svgContents[svgUrl] = this.responseText;
      delete IonIcon.activeRequests[svgUrl];

      const svgLoadCallbacks = IonIcon.loadCallbacks[svgUrl];
      if (svgLoadCallbacks) {

        for (var i = 0; i < svgLoadCallbacks.length; i++) {
          svgLoadCallbacks[i](this.responseText);
        }
        delete IonIcon.loadCallbacks[svgUrl];
      }
    });

    xhr.addEventListener('error', function () {
      console.error('Icon could not be loaded:', svgUrl);
    });

    xhr.open('GET', svgUrl, true);
    xhr.send();
  }


  render() {
    const svgUrl = this.getSvgUrl();
    if (svgUrl === null) {
      // we don't have good data
      return(<div class="missing-svg"></div>);
    }

    const svgContent = IonIcon.svgContents[svgUrl];
    if (svgContent === this.svgContent) {
      // we've already loaded up this svg at one point
      return(
        <div innerHTML={svgContent}></div>
      );
    }

    // start loading the svg file
    this.loadSvgContent(svgUrl);

    // actively requesting the svg, so let's just show a div for now
    return(<div class="loading-svg"></div>);
  }

}


const IonIcon: GlobalIonIcon = {
  activeRequests: {},
  loadCallbacks: [] as any,
  svgContents: {}
};

interface GlobalIonIcon {
  activeRequests: {[url: string]: boolean};
  loadCallbacks: {[url: string]: Function[]};
  svgContents: {[url: string]: string};
}
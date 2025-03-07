import * as React from "react";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { injectable, postConstruct } from "@theia/core/shared/inversify";
import ObsEditor from "./components/ObsEditor";

@injectable()
export class ContentDisplayWidget extends ReactWidget {
  static readonly ID = "content-display:widget";

  private content: string = "";
  private storyNum: string;

  @postConstruct()
  protected init(): void {
    this.id = ContentDisplayWidget.ID;
    this.title.label = "OBS Editor";
    this.title.caption = "OBS Editor";
    this.title.closable = true;
    this.update();
  }

  setContent(content: string, storyNum: string): void {
    this.content = content;
    this.storyNum = storyNum
    this.update();
  }

  render(): React.ReactElement {
    return (
      <div style={{ padding: "20px"}}>
        <ObsEditor content = {this.content} storyNum={this.storyNum}/>
      </div>
    );
  }
}

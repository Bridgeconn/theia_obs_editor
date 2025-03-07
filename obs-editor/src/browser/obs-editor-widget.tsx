import * as React from "react";
import {
  injectable,
  postConstruct,
  inject,
} from "@theia/core/shared/inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { WidgetManager } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core";
import { Message } from "@theia/core/lib/browser";
import WidgetContent from "./components/WidgetContent";
import { ContentDisplayWidget } from "./ContentDisplayWidget";
import { ApplicationShell } from "@theia/core/lib/browser";

@injectable()
export class ObsEditorWidget extends ReactWidget {

    static readonly ID = 'obs-editor:widget';
    static readonly LABEL = 'ObsEditor Widget';

    @inject(MessageService)
    protected readonly messageService!: MessageService;
  
    @inject(WidgetManager)
    protected readonly widgetManager!: WidgetManager;
  
    @inject(ApplicationShell)
    protected readonly shell!: ApplicationShell

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = ObsEditorWidget.ID;
        this.title.label = ObsEditorWidget.LABEL;
        this.title.caption = ObsEditorWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();
    }

    async openContentInMainArea(content: string, story: string): Promise<void> {
        let widget = await this.widgetManager.getWidget(ContentDisplayWidget.ID);
        
        if (!widget) {
          widget = await this.widgetManager.getOrCreateWidget(ContentDisplayWidget.ID);
          this.shell.addWidget(widget, { area: "main" });
        }
    
        if (widget instanceof ContentDisplayWidget) {
          widget.setContent(content, story);
        }
    
        this.shell.activateWidget(ContentDisplayWidget.ID);
      }

      render(): React.ReactElement {
        return <WidgetContent openContent={this.openContentInMainArea.bind(this)} />;
      }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: ObsEditor Widget Successfully Created!');
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}

import { ContainerModule } from '@theia/core/shared/inversify';
import { ObsEditorWidget } from './obs-editor-widget';
import { ObsEditorContribution } from './obs-editor-contribution';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { ContentDisplayWidget } from './ContentDisplayWidget';

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {
    bindViewContribution(bind, ObsEditorContribution);
    bind(FrontendApplicationContribution).toService(ObsEditorContribution);

    bind(ObsEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: ObsEditorWidget.ID,
        createWidget: () => ctx.container.get<ObsEditorWidget>(ObsEditorWidget)
    })).inSingletonScope();

    bind(ContentDisplayWidget).toSelf(); 
    bind(WidgetFactory).toDynamicValue((ctx) => ({
        id: ContentDisplayWidget.ID,
        createWidget: () => ctx.container.get<ContentDisplayWidget>(ContentDisplayWidget),
      })).inSingletonScope();

});

package eu.urzicroft.turbine.event;

import org.springframework.context.ApplicationEvent;

public class TurbineDataChangedEvent extends ApplicationEvent {
    public TurbineDataChangedEvent(Object source) {
        super(source);
    }
}

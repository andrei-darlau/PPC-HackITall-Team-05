package eu.urzicroft.turbine.listener;

import eu.urzicroft.turbine.annotation.TurbineDependentCache;
import eu.urzicroft.turbine.event.TurbineDataChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.support.AopUtils;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class TurbineCacheRegistry {

    private final CacheManager cacheManager;
    private final Set<String> registeredCaches = new HashSet<>();

    @EventListener(ApplicationReadyEvent.class)
    public void discoverDependentCaches(ApplicationReadyEvent event) {
        ApplicationContext context = event.getApplicationContext();

        for (String beanName : context.getBeanDefinitionNames()) {
            Object bean = context.getBean(beanName);
            Class<?> targetClass = AopUtils.getTargetClass(bean);

            ReflectionUtils.doWithMethods(targetClass, method -> {
                if (AnnotationUtils.findAnnotation(method, TurbineDependentCache.class) == null) {
                    return;
                }
                Cacheable cacheable = AnnotationUtils.findAnnotation(method, Cacheable.class);
                if (cacheable == null) {
                    return;
                }
                registeredCaches.addAll(Arrays.asList(cacheable.value()));
                registeredCaches.addAll(Arrays.asList(cacheable.cacheNames()));
            });
        }
        log.info("Discovered {} turbine-dependent caches: {}", registeredCaches.size(), registeredCaches);
    }

    @EventListener
    public void handleTurbineDataChange(TurbineDataChangedEvent event) {
        log.info("Turbine metadata changed! Evicting {} registered caches...", registeredCaches.size());

        for (String cacheName : registeredCaches) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.debug("Cleared cache: {}", cacheName);
            }
        }
    }
}

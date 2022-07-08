package service

import (
	"context"
	"log"

	"github.com/kubernetes/dashboard/src/app/backend/errors"
	"github.com/kubernetes/dashboard/src/app/backend/resource/dataselect"
	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

// MeshConfigDetail API resource provides mechanisms to inject containers with configuration data while keeping
// containers agnostic of Kubernetes
// GetMeshConfigDetail returns detailed information about an meshconfig
func GetMeshConfigServices(osmConfigClient osmconfigclientset.Interface, client client.Interface, service, name string, dsQuery *dataselect.DataSelectQuery) (*ServiceList, error) {
	log.Printf("Getting mesh service of %s meshconfig in %s service", name, service)

	configMap, err := client.CoreV1().ConfigMaps(service).Get(context.TODO(), name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}
	meshName := configMap.ObjectMeta.Labels["meshName"]
	options := metaV1.ListOptions{}
	options.LabelSelector = "openservicemesh.io/monitored-by=" + meshName
	namespaces, err := client.CoreV1().Namespaces().List(context.TODO(), options)
	if err != nil {
		return nil, err
	}

	serviceList := v1.ServiceList{Items: []v1.Service{}}
	for _, namespace := range namespaces.Items {
		services, err := client.CoreV1().Services(namespace.ObjectMeta.Name).List(context.TODO(), metaV1.ListOptions{})
		if err != nil {
			return nil, err
		}
		serviceList.Items = append(serviceList.Items, services.Items...)
	}

	nonCriticalErrors, criticalError := errors.HandleError(err)
	if criticalError != nil {
		return nil, criticalError
	}
	return CreateServiceList(serviceList.Items, nonCriticalErrors, dsQuery), nil
}

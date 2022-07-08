package namespace

import (
	"context"
	"log"

	"github.com/kubernetes/dashboard/src/app/backend/errors"
	"github.com/kubernetes/dashboard/src/app/backend/resource/dataselect"
	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

// MeshConfigDetail API resource provides mechanisms to inject containers with configuration data while keeping
// containers agnostic of Kubernetes
// GetMeshConfigDetail returns detailed information about an meshconfig
func GetMeshConfigNamespaces(osmConfigClient osmconfigclientset.Interface, client client.Interface, namespace, name string, dsQuery *dataselect.DataSelectQuery) (*NamespaceList, error) {
	log.Printf("Getting mesh namespace of %s meshconfig in %s namespace", name, namespace)

	configMap, err := client.CoreV1().ConfigMaps(namespace).Get(context.TODO(), name, metaV1.GetOptions{})
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

	nonCriticalErrors, criticalError := errors.HandleError(err)
	if criticalError != nil {
		return nil, criticalError
	}
	return toNamespaceList(namespaces.Items, nonCriticalErrors, dsQuery), nil
}

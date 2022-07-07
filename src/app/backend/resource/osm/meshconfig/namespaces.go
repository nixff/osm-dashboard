package meshconfig

import (
	"context"
	"log"

	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

// MeshConfigDetail API resource provides mechanisms to inject containers with configuration data while keeping
// containers agnostic of Kubernetes
// GetMeshConfigDetail returns detailed information about an meshconfig
func GetMeshConfigNamespaces(osmConfigClient osmconfigclientset.Interface, client client.Interface, namespace, name string) (*v1.NamespaceList, error) {
	log.Printf("Getting mesh namespace of %s meshconfig in %s namespace", name, namespace)

	configMap, err := client.CoreV1().ConfigMaps(namespace).Get(context.TODO(), name, metaV1.GetOptions{})
	if err != nil {
		return &v1.NamespaceList{}, nil
	}
	meshName := configMap.ObjectMeta.Labels["meshName"]
	options := metaV1.ListOptions{}
	options.LabelSelector = "openservicemesh.io/monitored-by=" + meshName
	namespaces, err := client.CoreV1().Namespaces().List(context.TODO(), options)
	if err != nil {
		return &v1.NamespaceList{}, nil
	}
	return namespaces, nil
}

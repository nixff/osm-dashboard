package pod

import (
	"context"
	"log"

	metricapi "github.com/kubernetes/dashboard/src/app/backend/integration/metric/api"
	"github.com/kubernetes/dashboard/src/app/backend/resource/common"
	"github.com/kubernetes/dashboard/src/app/backend/resource/dataselect"
	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sClient "k8s.io/client-go/kubernetes"
)

// MeshConfigDetail API resource provides mechanisms to inject containers with configuration data while keeping
// containers agnostic of Kubernetes
// GetMeshConfigDetail returns detailed information about an meshconfig
func GetMeshConfigPods(osmConfigClient osmconfigclientset.Interface, client k8sClient.Interface, metricClient metricapi.MetricClient,
	dsQuery *dataselect.DataSelectQuery, name string, namespace string) (*PodList, error) {
	log.Printf("Getting mesh pod of %s meshconfig in %s namespace", name, namespace)

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

	nss := []string{}
	for _, namespace := range namespaces.Items {
		nss = append(nss, namespace.ObjectMeta.Name)
	}
	nsQuery := common.NewNamespaceQuery(nss)

	channels := &common.ResourceChannels{
		PodList:   common.GetPodListChannelWithOptions(client, nsQuery, metaV1.ListOptions{}, 1),
		EventList: common.GetEventListChannel(client, nsQuery, 1),
	}

	return GetPodListFromChannels(channels, dsQuery, metricClient)

}

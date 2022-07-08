package meshconfig

import (
	"context"
	"log"

	osmconfigv1alph2 "github.com/openservicemesh/osm/pkg/apis/config/v1alpha2"
	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"

	"github.com/kubernetes/dashboard/src/app/backend/api"
	"github.com/kubernetes/dashboard/src/app/backend/errors"
	"github.com/kubernetes/dashboard/src/app/backend/resource/common"
	"github.com/kubernetes/dashboard/src/app/backend/resource/dataselect"
	podApi "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

// MeshConfig is a representation of a meshconfig.
type MeshConfig struct {
	ObjectMeta api.ObjectMeta `json:"objectMeta"`
	TypeMeta   api.TypeMeta   `json:"typeMeta"`
	// Spec is the MeshConfig specification.
	// +optional
	Spec       osmconfigv1alph2.MeshConfigSpec `json:"spec,omitempty"`
	MeshStatus MeshStatus                      `json:"status"`
	MeshName   string                          `json:"meshName"`
}

// MeshConfigList contains a list of MeshConfigs in the cluster.
type MeshConfigList struct {
	ListMeta api.ListMeta `json:"listMeta"`

	// Unordered list of meshconfigs.
	MeshConfigs []MeshConfig `json:"meshconfigs"`

	// List of non-critical errors, that occurred during resource retrieval.
	Errors []error `json:"errors"`
}
type MeshStatus struct {
	Bootstrap  string `json:"bootstrap"`
	Controller string `json:"controller"`
	Injector   string `json:"injector"`
}

// GetMeshConfigList returns a list of all MeshConfigs in the cluster.
func GetMeshConfigList(osmConfigClient osmconfigclientset.Interface, client client.Interface, nsQuery *common.NamespaceQuery,
	dsQuery *dataselect.DataSelectQuery) (*MeshConfigList, error) {
	log.Print("Getting list of all meshconfigs in the cluster")

	channels := &common.ResourceChannels{
		MeshConfigList: common.GetMeshConfigListChannel(osmConfigClient, nsQuery, 1),
	}

	return GetMeshConfigListFromChannels(client, channels, dsQuery)
}

// GetMeshConfigListFromChannels returns a list of all MeshConfigs in the cluster.
func GetMeshConfigListFromChannels(client client.Interface, channels *common.ResourceChannels,
	dsQuery *dataselect.DataSelectQuery) (*MeshConfigList, error) {
	meshConfigs := <-channels.MeshConfigList.List
	err := <-channels.MeshConfigList.Error
	nonCriticalErrors, criticalError := errors.HandleError(err)
	if criticalError != nil {
		return nil, criticalError
	}

	return CreateMeshConfigList(client, meshConfigs.Items, nonCriticalErrors, dsQuery), nil
}

func toMeshConfig(client client.Interface, meshConfig *osmconfigv1alph2.MeshConfig) MeshConfig {

	namespace := meshConfig.ObjectMeta.Namespace

	options := metaV1.ListOptions{}
	options.LabelSelector = "app=osm-bootstrap"
	bootstraps, err := client.CoreV1().Pods(namespace).List(context.TODO(), options)

	options.LabelSelector = "app=osm-controller"
	controllers, err := client.CoreV1().Pods(namespace).List(context.TODO(), options)

	options.LabelSelector = "app=osm-injector"
	injectors, err := client.CoreV1().Pods(namespace).List(context.TODO(), options)

	meshStatus := MeshStatus{}
	if err == nil {
		meshStatus = MeshStatus{
			Bootstrap:  GetPodStatus(bootstraps.Items),
			Controller: GetPodStatus(controllers.Items),
			Injector:   GetPodStatus(injectors.Items),
		}
	}

	meshName := ""
	configMap, err := client.CoreV1().ConfigMaps(namespace).Get(context.TODO(), meshConfig.ObjectMeta.Name, metaV1.GetOptions{})
	if err == nil {
		meshName = configMap.ObjectMeta.Labels["meshName"]
	}
	return MeshConfig{
		ObjectMeta: api.NewObjectMeta(meshConfig.ObjectMeta),
		TypeMeta:   api.NewTypeMeta(api.ResourceKindMeshConfig),
		Spec:       meshConfig.Spec,
		MeshStatus: meshStatus,
		MeshName:   meshName,
	}
}
func GetPodStatus(pods []podApi.Pod) string {
	result := "running"
	if len(pods) == 0 {
		return "stop"
	}
	PodRunning := 0
	PodPending := 0
	PodFailed := 0
	PodSucceeded := 0
	for _, pod := range pods {
		switch pod.Status.Phase {
		case podApi.PodRunning:
			PodRunning++
		case podApi.PodPending:
			PodPending++
		case podApi.PodFailed:
			PodFailed++
		case podApi.PodSucceeded:
			PodSucceeded++
		}
	}
	if PodFailed > 0 {
		result = "error"
	} else if PodPending > 0 {
		result = "pending"
	}

	return result
}

// CreateMeshConfigList returns paginated traffictarget list based on given traffictarget array and pagination query.
func CreateMeshConfigList(client client.Interface, meshConfigs []osmconfigv1alph2.MeshConfig, nonCriticalErrors []error, dsQuery *dataselect.DataSelectQuery) *MeshConfigList {
	meshConfigsList := &MeshConfigList{
		MeshConfigs: make([]MeshConfig, 0),
		ListMeta:    api.ListMeta{TotalItems: len(meshConfigs)},
		Errors:      nonCriticalErrors,
	}

	meshConfigCells, filteredTotal := dataselect.GenericDataSelectWithFilter(toCells(meshConfigs), dsQuery)
	meshConfigs = fromCells(meshConfigCells)
	meshConfigsList.ListMeta = api.ListMeta{TotalItems: filteredTotal}

	for _, meshConfig := range meshConfigs {
		meshConfigsList.MeshConfigs = append(meshConfigsList.MeshConfigs, toMeshConfig(client, &meshConfig))

	}

	return meshConfigsList
}

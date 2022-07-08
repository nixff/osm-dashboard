package osmcli

type OsmInstallSpec struct {
	MeshName string `json:"name"`

	Namespace string `json:"namespace"`

	EnforceSingleMesh bool `json:"enforceSingleMesh"`

	Timeout int64 `json:"timeout"`

	Atomic bool `json:"atomic"`

	Options Options `json:"options"`
}
type Options struct {
	Osm Osm `json:"osm"`
}

type Osm struct {
	Tracing          Tracing    `json:"tracing"`
	Prometheus       Prometheus `json:"prometheus"`
	Grafana          Grafana    `json:"grafana"`
	DeployGrafana    bool       `json:"deployGrafana"`
	DeployJaeger     bool       `json:"deployJaeger"`
	DeployPrometheus bool       `json:"deployPrometheus"`
}

type Tracing struct {
	Enable   bool   `json:"enable"`
	Address  string `json:"address"`
	Port     int32  `json:"port"`
	Endpoint string `json:"endpoint"`
}
type Prometheus struct {
	Image string `json:"image"`
	Port  int32  `json:"port"`
}
type Grafana struct {
	EnableRemoteRendering bool   `json:"enableRemoteRendering"`
	Address               string `json:"address"`
	Image                 string `json:"image"`
	RendererImage         string `json:"rendererImage"`
	Port                  int32  `json:"port"`
}

func NewOsmInstallSpec() OsmInstallSpec {
	osmInstallSpec := OsmInstallSpec{}
	return osmInstallSpec
}

type OsmUninstallSpec struct {
	MeshName string `json:"meshName"`

	Namespace string `json:"namespace"`
}

func NewOsmUninstallSpec() OsmUninstallSpec {
	osmUninstallSpec := OsmUninstallSpec{}
	osmUninstallSpec.MeshName = "osm"
	osmUninstallSpec.Namespace = "osm-system"
	return osmUninstallSpec
}

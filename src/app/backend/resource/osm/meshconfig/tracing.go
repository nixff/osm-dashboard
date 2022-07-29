package meshconfig

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"runtime/debug"
	"strings"
	"time"

	osmconfigclientset "github.com/openservicemesh/osm/pkg/gen/client/config/clientset/versioned"
	"gopkg.in/ffmt.v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

type QueryTracingInfo struct {
	Data   []interface{} `json:"data"`
	Status string        `json:"status"`
}

// ProxyTracing returns detailed information about an query
func ProxyNamespaceTracing(osmConfigClient osmconfigclientset.Interface, client client.Interface, namespace, uri string) (*QueryTracingInfo, error) {
	log.Printf("Getting details of %s proxy Tracing in %s namespace", "tracing", namespace)

	ns, err := client.CoreV1().Namespaces().Get(context.TODO(), namespace, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}
	opt := metaV1.ListOptions{}
	opt.FieldSelector = "metadata.name=" + ns.Labels["openservicemesh.io/monitored-by"] + "-mesh-config"
	cms, err := client.CoreV1().ConfigMaps("").List(context.TODO(), opt)
	if err != nil || len(cms.Items) == 0 {
		return nil, err
	}

	// TODO
	url := "http://jaeger." + cms.Items[0].Namespace + ".svc.cluster.local:16686/api/"
	url = "http://192.168.10.35:31005/api/"
	replaceStr := "/api/v1/tracing/" + namespace + "/"

	promResult, err := QueryJeager(url, strings.Replace(uri, replaceStr, "", 1))

	if err != nil {
		return &QueryTracingInfo{}, nil
	}

	return promResult, nil
}

// ProxyTracing returns detailed information about an query
func ProxyTracing(osmConfigClient osmconfigclientset.Interface, client client.Interface, namespace, name, uri string) (*QueryTracingInfo, error) {
	log.Printf("Getting details of %s proxy Tracing in %s namespace", name, namespace)
	// TODO
	url := "http://jaeger." + namespace + ".svc.cluster.local:16686/api/"
	url = "http://192.168.10.35:31005/api/"
	replaceStr := "/api/v1/meshconfig/" + namespace + "/" + name + "/tracing"

	promResult, err := QueryJeager(url, strings.Replace(uri, replaceStr, "", 1))

	if err != nil {
		return &QueryTracingInfo{}, nil
	}

	return promResult, nil
}

// query metric by tracing api
func QueryJeager(endpoint string, query string) (*QueryTracingInfo, error) {
	info := &QueryTracingInfo{}
	ustr := endpoint + query
	u, err := url.Parse(ustr)
	if err != nil {
		return info, err
	}
	u.RawQuery = u.Query().Encode()
	err = GetJeagerResult(u.String(), &info)
	if err != nil {
		ffmt.Puts(info)
		return info, err
	}
	return info, nil
}
func GetJeagerResult(url string, result interface{}) error {
	httpClient := &http.Client{Timeout: 10 * time.Second}
	r, err := httpClient.Get(url)
	if err != nil {
		return err
	}

	defer r.Body.Close()
	err = json.NewDecoder(r.Body).Decode(result)
	if err != nil {
		fmt.Printf("%s", debug.Stack())
		debug.PrintStack()
		return err
	}
	return nil
}

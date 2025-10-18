# Overview

This project is designed as a hands-on learning and reference guide for developers and DevOps engineers exploring GitOps workflows with ArgoCD.

In this repo, I will:

- Learn how to set up multiple Kubernetes clusters (management + application).

- Deploy and manage multiple microservices through ArgoCD.

- Integrate CI/CD pipelines via GitHub Actions for automated image builds and manifest updates.

- Securely manage secrets using Bitnami Sealed Secrets.


## Architecture Overview

```bash
+------------------------+
| GitHub Repository |
| (Source of Truth) |
+------------------------+
|
| (git push triggers CI)
v
+------------------------+
| GitHub Actions CI/CD |
| - Build Docker images |
| - Update manifests |
+------------------------+
|
| (auto-sync)
v
+-----------------------------+
| ArgoCD Server |
| (on management cluster) |
+-----------------------------+
|
| manages apps
v
+-----------------------------+
| App Cluster(s) |
| (Kubernetes Workloads) |
+-----------------------------+
```

## Prerequisites

- A computer with WSL2 and Ubuntu installed.

- Docker Desktop (with WSL integration enabled).

- GitHub Account (for hosting repo and using Actions).

- Docker Hub Account (or alternative image registry).


## Setup Steps

1. Environment Setup

- Install dependencies inside WSL Ubuntu & Verify Other Installations:

```bash
docker --version
kind --version
kubectl version --client
argocd version --client
git --version
```

### Installed tools:

- **kubectl** for cluster management.

- **kind** to create local Kubernetes clusters.

- **argocd** CLI for ArgoCD control.

- **yq and jq** for YAML/JSON processing.


## 2. Create a single Kind cluster

### 2.1: Create a Kind config file:
```bash
cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
EOF
```


### Create the cluster:

```bash
kind create cluster --name kind-cluster-management --config kind-config.yaml
```

### Verify nodes:
```bash
kubectl get nodes
```


## Install ArgoCD

- Create ArgoCD namespace:
```bash
kubectl create namespace argocd
```

- Install ArgoCD manifests:
```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
![](./img/1a.create.namespace.png)


- Verify pods:
```bash
kubectl get pods -n argocd
```
![](./img/1b.get.pd.png)


### Port-forward ArgoCD API
```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```
**Access via browser at `https://localhost:8080`**



### Login with ArgoCD CLI

## Get initial password
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode
argocd login localhost:8080 --username admin --password <PASTE_PASSWORD_HERE> --insecure
```

### Change password:
```bash
argocd account update-password --current-password <OLD_PASSWORD> --new-password <NEW_PASSWORD>
```


## Prepare Git repository structure for microservices

- Create folders:

```bash
mkdir -p my-gitops-repo/applications/microservice-1
mkdir -p my-gitops-repo/applications/microservice-2
```

Each microservice will have:

- deployment.yaml

- service.yaml


### Create microservice-1/deployment.yaml:

```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: microservice-1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: microservice-1
  template:
    metadata:
      labels:
        app: microservice-1
    spec:
      containers:
      - name: microservice-1
        image: nginx:stable
        ports:
        - containerPort: 80
```

### Create microservice-1/deployment.yaml:

```bash
apiVersion: apps/v1
kind: Deployment
metadata:
  name: microservice-1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: microservice-1
  template:
    metadata:
      labels:
        app: microservice-1
    spec:
      containers:
      - name: microservice-1
        image: nginx:stable
        ports:
        - containerPort: 80
```


### microservice-1/service.yaml:

```bash
apiVersion: v1
kind: Service
metadata:
  name: microservice-1
spec:
  selector:
    app: microservice-1
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
```




















### 2.2: Check contexts
```bash
kubectl config get-contexts
```

### Confirm each cluster is reachable
```bash
kubectl --context kind-cluster-management get nodes
kubectl --context kind-cluster-app get nodes
```



#### - Install ArgoCD 

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```
![](./img/1a.create.namespace.png)



### Add app cluster to ArgoCD
```bash
kubectl config use-context kind-cluster-management
docker ps --format '{{.Names}}'
docker start kind-cluster-app-control-plane
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cluster-app-control-plane 
kubectl config set-cluster kind-cluster-app --server=https://172.18.0.7:6***
argocd cluster add kind-cluster-app
```




#### Port-forward the ArgoCD 
```bash
argocd login localhost:8080 --username admin --password <your-password> --insecure
```
**Then open https://localhost:8080 in your browser**

#### Get Password
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode
```


#### Login with CLI
```bash
argocd login localhost:8080 --insecure
argocd account update-password --current-password <the-initial-password> --new-password <yourpassword>
```


### Initialize and Push to GitHub

- Create a github repo
```bash
git init
git add .
git commit -m "Initial GitOps commit with ArgoCD setup"
git remote add origin https://github.com/username/repo.git
git branch -M main
git push -u origin main
```


## 3: Register the second cluster with ArgoCD

#### Make sure kubectl context list includes both clusters
```bash
kubectl config get-contexts
```

#### Expose the app cluster API and connect using its container network addres

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' cluster-app-control-plane
kubectl config set-cluster kind-cluster-app --server=https://172.18.0.7:****
```

#### Test connectivity from the management cluster’s pod network
```bash
kubectl -n argocd exec -it deploy/argocd-repo-server -- curl -k https://172.18.0.7:6443/version
```

#### Create a shared Docker network
```bash
docker network create kind
kind create cluster --name cluster-management --config kind-config.yaml
kind create cluster --name cluster-app --config kind-config.yaml
docker ps --format "table {{.Names}}\t{{.Networks}}"
```


#### In WSL terminal, run the argocd cluster add command
```bash
argocd cluster add kind-cluster-app
```
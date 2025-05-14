pipeline {
    agent any

    environment {
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
    }

    parameters {
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Docker image tag passed from GitHub Actions')
    }

    stages {
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    sh '''
                      echo "Templating Kubernetes manifests with image tag..."
                      export IMAGE_TAG=${IMAGE_TAG}
                      envsubst < kubernetes/bot-service.yml | kubectl apply -f - -n tic-tac-toe
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                script {
                    sh '''
                        echo "Applying Kubernetes manifests to EKS..."
                        kubectl apply -f kubernetes/ --recursive -n tic-tac-toe
                        kubectl rollout status deployment/frontend-service -n tic-tac-toe
                        kubectl rollout status deployment/lang-service -n tic-tac-toe
                        kubectl rollout status deployment/bot-service -n tic-tac-toe
                        kubectl rollout status deployment/db -n tic-tac-toe
                    '''
                }
            }
        }
    }
}

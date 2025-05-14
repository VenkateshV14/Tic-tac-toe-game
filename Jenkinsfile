pipeline {
    agent any

    environment {
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
    }

    stages {
        stage('Deploy to EKS') {
            steps {
                script {
                    sh '''
                        echo "Applying Kubernetes manifests to EKS..."
                        kubectl apply -f kubernetes/ --recursive -n tic-tac-toe
                        kubectl rollout status deployment/frontend-service -n tic-tac-toe
                        kubectl rollout status deployment/lang-service -n tic-tac-toe
                        kubectl rollout status deployment/bot-service -n tic-tac-toe
                    '''
                }
            }
        }
    }
}

# Install via Docker
To run Bumblebee using a Docker Image on any infrastructure you can use Docker Hub.
From a remote server (hosting externally):

```
docker run --name bumblebee --network="host" -e ADDRESS=<IP> hiprimus/bumblebee:3.0
```

Or from your local machine (using localhost):

```
docker run --name bumblebee -p 3000:3000 -p 4000:4000 -e ADDRESS=localhost hiprimus/bumblebee:3.0
```

For `--name` you can use any name you want for your environment and on `ADDRESS=<IP>` you must input the public IP address of your server. Remember to open ports `3000` and `4000` on your host. Please have in mind the host networking driver only works on Linux hosts, and is not supported on Docker Desktop for Mac, Docker Desktop for Windows, or Docker EE for Windows Server.
To just pull the image without running it you can use:

```
docker pull hiprimus/bumblebee:3.0
```

## Adding Spark support (Experimental)
To enable Spark support, replace `hiprimus/bumblebee:3.0` by `hiprimus/bumblebee:3.0-spark`.
‌

import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cluster } from "./interface/cluster.interface";

@Injectable()
export class ClusterService {
  constructor(@InjectModel("Cluster") private clusterModel: Model<Cluster>) {}

  async getClusters() {}

  async createCluster() {}

  async udpateCluster() {}

  async deleteCluster() {}
}

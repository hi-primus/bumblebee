import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron("* * */12 * * *")
  handleCron() {
    this.logger.debug("Called every 12 hours");
  }
}

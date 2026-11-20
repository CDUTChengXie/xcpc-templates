# HopcroftKarp与二分图最小点覆盖

无权二分图，左右点已区分；加边后先 work 再读匹配或 minVertexCover。 左点 0..nL-1、右点 0..nR-1；left[u]/right[v] 为配对点，未配对为 -1。 点覆盖为 {左点列表,右点列表}，补集是最大独立集；边覆盖有孤点时为 nullopt。

minEdgeCover/criticalPoints 自动重新求匹配；criticalPoints 返回删后会减少匹配数的点。

匹配 O(m√(nL+nR)+nL+nR)；点覆盖 O(nL+nR+m)；空间 O(nL+nR+m)。

```cpp
// 稀疏二分图最大匹配与相关覆盖
struct HopcroftKarp {
    int leftCount, rightCount;
    std::vector<std::vector<int>> adj;
    // work 后，left[u] 是左点 u 配到的右点，right[v] 是右点 v 配到的左点；未匹配为 -1
    std::vector<int> left, right, depth;
    // 创建左右两组点，组内编号均从 0 开始
    HopcroftKarp(int n, int m)
        : leftCount(n), rightCount(m), adj(n), left(n, -1), right(m, -1), depth(n) {
        assert(n >= 0 && m >= 0);
    }
    // 添加左点 u 到右点 v 的边，无返回值
    void addEdge(int u, int v) {
        assert(u >= 0 && u < leftCount && v >= 0 && v < rightCount);
        adj[u].push_back(v);
    }
    // 返回最大匹配对数；结果保存在 left/right，未匹配为 -1；每次调用重新计算
    int work() {
        std::fill(left.begin(), left.end(), -1);
        std::fill(right.begin(), right.end(), -1);
        int total = 0;
        while (true) {
            std::queue<int> q;
            std::fill(depth.begin(), depth.end(), -1);
            for (int u = 0; u < leftCount; ++u)
                if (left[u] == -1) {
                    depth[u] = 0;
                    q.push(u);
                }
            int shortest = leftCount + 1;
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                if (depth[u] >= shortest)
                    continue;
                for (int v : adj[u]) {
                    if (right[v] == -1)
                        shortest = depth[u] + 1;
                    else if (depth[right[v]] == -1) {
                        depth[right[v]] = depth[u] + 1;
                        q.push(right[v]);
                    }
                }
            }
            if (shortest == leftCount + 1)
                break;
            auto dfs = [&](int u) -> bool {
                struct Frame {
                    int vertex, incoming;
                    size_t next;
                };
                std::vector<Frame> frames{{u, -1, 0}};
                while (!frames.empty()) {
                    auto &frame = frames.back();
                    int vertex = frame.vertex;
                    if (frame.next == adj[vertex].size()) {
                        depth[vertex] = -1;
                        frames.pop_back();
                        continue;
                    }
                    int next = adj[vertex][frame.next++];
                    if (right[next] == -1) {
                        if (depth[vertex] + 1 != shortest)
                            continue;
                        for (int index = int(frames.size()) - 1; index >= 0; --index) {
                            left[frames[index].vertex] = next;
                            right[next] = frames[index].vertex;
                            next = frames[index].incoming;
                        }
                        return true;
                    }
                    if (depth[right[next]] == depth[vertex] + 1)
                        frames.push_back({right[next], next, 0});
                }
                return false;
            };
            for (int u = 0; u < leftCount; ++u)
                if (left[u] == -1 && dfs(u))
                    ++total;
        }
        return total;
    }
    // work 后调用；返回 {左侧选中点,右侧选中点} 的最小点覆盖
    std::pair<std::vector<int>, std::vector<int>> minVertexCover() const {
        std::vector<bool> seenL(leftCount), seenR(rightCount);
        std::queue<int> q;
        for (int u = 0; u < leftCount; ++u)
            if (left[u] == -1) {
                seenL[u] = true;
                q.push(u);
            }
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u])
                if (left[u] != v && !seenR[v]) {
                    seenR[v] = true;
                    int next = right[v];
                    if (next != -1 && !seenL[next]) {
                        seenL[next] = true;
                        q.push(next);
                    }
                }
        }
        std::vector<int> a, b;
        for (int u = 0; u < leftCount; ++u)
            if (!seenL[u])
                a.push_back(u);
        for (int v = 0; v < rightCount; ++v)
            if (seenR[v])
                b.push_back(v);
        return {a, b};
    }
    // 重新求匹配，返回覆盖全部顶点的最少边集；存在孤点时返回空 optional
    std::optional<std::vector<std::pair<int, int>>> minEdgeCover() {
        work();
        std::vector<int> neighbor(rightCount, -1);
        std::vector<std::pair<int, int>> answer;
        for (int u = 0; u < leftCount; ++u) {
            if (adj[u].empty())
                return std::nullopt;
            for (int v : adj[u])
                neighbor[v] = u;
            if (left[u] != -1)
                answer.push_back({u, left[u]});
        }
        for (int v = 0; v < rightCount; ++v)
            if (neighbor[v] == -1)
                return std::nullopt;
        for (int u = 0; u < leftCount; ++u)
            if (left[u] == -1)
                answer.push_back({u, adj[u][0]});
        for (int v = 0; v < rightCount; ++v)
            if (right[v] == -1)
                answer.push_back({neighbor[v], v});
        return answer;
    }
    // 重新求匹配；返回删去后最大匹配数会下降的{左点列表,右点列表}
    std::pair<std::vector<int>, std::vector<int>> criticalPoints() {
        work();
        std::vector<std::vector<int>> rev(rightCount);
        for (int u = 0; u < leftCount; ++u)
            for (int v : adj[u])
                rev[v].push_back(u);
        std::vector<bool> seenL(leftCount), seenR(rightCount);
        std::queue<int> q;
        for (int u = 0; u < leftCount; ++u)
            if (left[u] == -1) {
                seenL[u] = true;
                q.push(u);
            }
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u]) {
                int next = right[v];
                if (next != -1 && !seenL[next]) {
                    seenL[next] = true;
                    q.push(next);
                }
            }
        }
        for (int v = 0; v < rightCount; ++v)
            if (right[v] == -1) {
                seenR[v] = true;
                q.push(v);
            }
        while (!q.empty()) {
            int v = q.front();
            q.pop();
            for (int u : rev[v]) {
                int next = left[u];
                if (next != -1 && !seenR[next]) {
                    seenR[next] = true;
                    q.push(next);
                }
            }
        }
        std::vector<int> a, b;
        for (int u = 0; u < leftCount; ++u)
            if (left[u] != -1 && !seenL[u])
                a.push_back(u);
        for (int v = 0; v < rightCount; ++v)
            if (right[v] != -1 && !seenR[v])
                b.push_back(v);
        return {a, b};
    }
};
```
